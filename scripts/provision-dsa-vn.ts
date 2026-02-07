import axios, { AxiosError, AxiosInstance, Method } from 'axios'
import dotenv from 'dotenv'

dotenv.config()

type Envelope<T> = { data?: T; message?: string; success?: boolean }
type Level = 'beginner' | 'intermediate'
type Runtime = { language: string; versions: string[]; aliases: string[] }
type Course = { _id: string; slug: string; title: string }
type Chapter = { _id: string; title: string }
type Lesson = { _id: string; title: string; contentType: 'video' | 'article' | 'quiz' | 'coding' }
type Category = { _id: string; slug: string; name: string; status: string }

const API_URL = process.env.PROVISION_API_URL || 'https://edunova-api.vercel.app/api/v1'
const TOKEN = process.env.PROVISION_API_TOKEN || ''
const DRY = process.env.PROVISION_DSA_DRY_RUN === 'true'
const UPDATE = process.env.PROVISION_DSA_UPDATE_EXISTING === 'true'
const DELAY = Number.parseInt(process.env.PROVISION_DSA_DELAY_MS || '120', 10)
const VIDEO_URL = process.env.PROVISION_DSA_VIDEO_URL || 'https://www.youtube.com/watch?v=8hly31xKli0'
const CODING_LANGUAGE = (process.env.PROVISION_DSA_LANGUAGE || 'java').trim().toLowerCase()
const CODING_VERSION = (process.env.PROVISION_DSA_VERSION || '').trim()
const MAX_RETRIES = Number.parseInt(process.env.PROVISION_DSA_RETRY_ATTEMPTS || '10', 10)
const RETRY_BASE_MS = Number.parseInt(process.env.PROVISION_DSA_RETRY_BASE_MS || '1000', 10)
const MIN_REQUEST_INTERVAL_MS = Number.parseInt(process.env.PROVISION_DSA_MIN_REQUEST_INTERVAL_MS || '250', 10)

const NEED = ['category:create', 'course:create', 'chapter:create', 'lesson:create']
const CAT = { name: 'Data Structures and Algorithms', slug: 'data-structures-and-algorithms', status: 'active' }

const COURSES: Array<{ title: string; slug: string; level: Level; image: string }> = [
  { title: 'DSA 01 - Tư duy giải thuật và độ phức tạp', slug: 'dsa-01-tu-duy-giai-thuat-va-do-phuc-tap', level: 'beginner', image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=1200&h=630&fit=crop' },
  { title: 'DSA 02 - Mảng và Chuỗi', slug: 'dsa-02-mang-va-chuoi', level: 'beginner', image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=1200&h=630&fit=crop' },
  { title: 'DSA 03 - Linked List, Stack, Queue', slug: 'dsa-03-linked-list-stack-queue', level: 'beginner', image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=1200&h=630&fit=crop' },
  { title: 'DSA 04 - Hash Table, Set, Map', slug: 'dsa-04-hash-table-set-map', level: 'intermediate', image: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=1200&h=630&fit=crop' },
  { title: 'DSA 05 - Tree, BST, Heap', slug: 'dsa-05-tree-bst-heap', level: 'intermediate', image: 'https://images.unsplash.com/photo-1518773553398-650c184e0bb3?w=1200&h=630&fit=crop' },
  { title: 'DSA 06 - Graph cơ bản', slug: 'dsa-06-graph-co-ban', level: 'intermediate', image: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=1200&h=630&fit=crop' },
  { title: 'DSA 07 - Sorting và Searching', slug: 'dsa-07-sorting-searching', level: 'beginner', image: 'https://images.unsplash.com/photo-1484417894907-623942c8ee29?w=1200&h=630&fit=crop' },
  { title: 'DSA 08 - Đệ quy, Backtracking, DP cơ bản', slug: 'dsa-08-de-quy-backtracking-dp-co-ban', level: 'intermediate', image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=630&fit=crop' }
]

const CHAPTERS: Record<string, [string, string, string, string]> = {
  'dsa-01-tu-duy-giai-thuat-va-do-phuc-tap': ['Tư duy thuật toán và mô hình bài toán', 'Độ phức tạp thời gian và không gian', 'Kỹ thuật phân tích và tối ưu hóa', 'Luyện tập tổng hợp Big-O'],
  'dsa-02-mang-va-chuoi': ['Mảng 1 chiều và kỹ thuật duyệt', 'Hai con trỏ và sliding window', 'Chuỗi và xử lý ký tự', 'Bài toán tổng hợp mảng và chuỗi'],
  'dsa-03-linked-list-stack-queue': ['Linked List cơ bản', 'Stack và ứng dụng', 'Queue và deque', 'Tổng hợp cấu trúc tuyến tính'],
  'dsa-04-hash-table-set-map': ['Hash Table và hàm băm', 'Set/Map và frequency counting', 'Kỹ thuật kiểm tra trùng lặp', 'Bài toán hashing tổng hợp'],
  'dsa-05-tree-bst-heap': ['Cây nhị phân cơ bản', 'Binary Search Tree', 'Heap và Priority Queue', 'Tổng hợp cây và heap'],
  'dsa-06-graph-co-ban': ['Biểu diễn đồ thị', 'BFS và ứng dụng', 'DFS và connected components', 'Tổng hợp đồ thị cơ bản'],
  'dsa-07-sorting-searching': ['Thuật toán sắp xếp O(n^2)', 'Merge sort và quick sort', 'Binary search và biến thể', 'Bài toán tổng hợp tìm kiếm'],
  'dsa-08-de-quy-backtracking-dp-co-ban': ['Đệ quy và chia để trị', 'Backtracking cơ bản', 'Dynamic Programming 1D', 'Dynamic Programming 2D']
}

type Problem = {
  key: string
  title: string
  starterCode: string
  solutionCode: string
  inputSpec: string
  outputSpec: string
  vIn: string
  vOut: string
  h1In: string
  h1Out: string
  h2In: string
  h2Out: string
}

const P: Record<string, Problem> = {
  sum: { key: 'sum', title: 'Tổng phần tử mảng', starterCode: "n=int(input())\na=list(map(int,input().split()))\n# TODO", solutionCode: "n=int(input())\na=list(map(int,input().split()))\nprint(sum(a[:n]))", inputSpec: '- n\n- n số nguyên', outputSpec: 'In tổng.', vIn: '5\n1 2 3 4 5', vOut: '15', h1In: '4\n10 -2 3 1', h1Out: '12', h2In: '3\n0 0 0', h2Out: '0' },
  two_sum: { key: 'two_sum', title: 'Two Sum in chỉ số', starterCode: "n=int(input())\na=list(map(int,input().split()))\nt=int(input())\n# TODO", solutionCode: "n=int(input())\na=list(map(int,input().split()))\nt=int(input())\nseen={}\nans=(-1,-1)\nfor i,x in enumerate(a[:n]):\n y=t-x\n if y in seen:\n  ans=(seen[y],i);break\n if x not in seen:seen[x]=i\nprint(ans[0],ans[1])", inputSpec: '- n\n- mảng n số\n- target', outputSpec: 'In i j hoặc -1 -1.', vIn: '4\n2 7 11 15\n9', vOut: '0 1', h1In: '5\n3 2 4 8 1\n6', h1Out: '1 2', h2In: '4\n1 2 3 4\n100', h2Out: '-1 -1' },
  bs: { key: 'bs', title: 'Binary Search vị trí đầu tiên', starterCode: "n=int(input())\na=list(map(int,input().split()))\nt=int(input())\n# TODO", solutionCode: "n=int(input())\na=list(map(int,input().split()))\nt=int(input())\nl,r=0,n-1\nans=-1\nwhile l<=r:\n m=(l+r)//2\n if a[m]>=t:r=m-1\n else:l=m+1\n if a[m]==t:ans=m\nprint(ans)", inputSpec: '- n\n- mảng tăng dần\n- target', outputSpec: 'In index đầu tiên hoặc -1.', vIn: '6\n1 2 2 2 3 4\n2', vOut: '1', h1In: '5\n1 3 5 7 9\n4', h1Out: '-1', h2In: '4\n2 2 2 2\n2', h2Out: '0' },
  max_sub: { key: 'max_sub', title: 'Tổng lớn nhất dãy con liên tiếp', starterCode: "n=int(input())\na=list(map(int,input().split()))\n# TODO", solutionCode: "n=int(input())\na=list(map(int,input().split()))\ncur=best=a[0]\nfor x in a[1:n]:\n cur=max(x,cur+x)\n best=max(best,cur)\nprint(best)", inputSpec: '- n\n- mảng n số', outputSpec: 'In tổng lớn nhất.', vIn: '9\n-2 1 -3 4 -1 2 1 -5 4', vOut: '6', h1In: '5\n1 2 3 4 5', h1Out: '15', h2In: '4\n-8 -3 -6 -2', h2Out: '-2' },
  bfs: { key: 'bfs', title: 'Đường đi ngắn nhất BFS', starterCode: "n,m=map(int,input().split())\n# TODO", solutionCode: "from collections import deque\nn,m=map(int,input().split())\ng=[[] for _ in range(n+1)]\nfor _ in range(m):\n u,v=map(int,input().split());g[u].append(v);g[v].append(u)\ns,t=map(int,input().split())\nd=[-1]*(n+1);d[s]=0\nq=deque([s])\nwhile q:\n u=q.popleft()\n for v in g[u]:\n  if d[v]==-1:\n   d[v]=d[u]+1;q.append(v)\nprint(d[t])", inputSpec: '- n m\n- m cạnh u v\n- s t', outputSpec: 'In khoảng cách hoặc -1.', vIn: '5 5\n1 2\n2 3\n3 4\n4 5\n1 5\n1 4', vOut: '2', h1In: '4 2\n1 2\n3 4\n1 4', h1Out: '-1', h2In: '3 2\n1 2\n2 3\n1 3', h2Out: '2' },
  fib: { key: 'fib', title: 'Fibonacci bằng DP', starterCode: "n=int(input())\n# TODO", solutionCode: "n=int(input())\nif n<=1:print(n)\nelse:\n a,b=0,1\n for _ in range(2,n+1):a,b=b,a+b\n print(b)", inputSpec: '- n (0..45)', outputSpec: 'In F(n).', vIn: '10', vOut: '55', h1In: '0', h1Out: '0', h2In: '1', h2Out: '1' },
  knap: { key: 'knap', title: '0/1 Knapsack cơ bản', starterCode: "n,W=map(int,input().split())\n# TODO", solutionCode: "n,W=map(int,input().split())\nitems=[tuple(map(int,input().split())) for _ in range(n)]\ndp=[0]*(W+1)\nfor w,v in items:\n for c in range(W,w-1,-1):\n  dp[c]=max(dp[c],dp[c-w]+v)\nprint(dp[W])", inputSpec: '- n W\n- n dòng w v', outputSpec: 'In giá trị lớn nhất.', vIn: '3 5\n2 3\n3 4\n4 5', vOut: '7', h1In: '4 7\n1 1\n3 4\n4 5\n5 7', h1Out: '9', h2In: '2 3\n4 10\n5 20', h2Out: '0' },
  lcs: { key: 'lcs', title: 'Độ dài LCS', starterCode: "a=input().strip()\nb=input().strip()\n# TODO", solutionCode: "a=input().strip();b=input().strip();n,m=len(a),len(b)\ndp=[[0]*(m+1) for _ in range(n+1)]\nfor i in range(1,n+1):\n for j in range(1,m+1):\n  if a[i-1]==b[j-1]:dp[i][j]=dp[i-1][j-1]+1\n  else:dp[i][j]=max(dp[i-1][j],dp[i][j-1])\nprint(dp[n][m])", inputSpec: '- chuỗi a\n- chuỗi b', outputSpec: 'In độ dài LCS.', vIn: 'abcde\nace', vOut: '3', h1In: 'abc\nabc', h1Out: '3', h2In: 'abc\ndef', h2Out: '0' }
}

const JAVA_STARTER: Record<string, string> = {
  sum: "import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    int[] a = new int[n];\n    for (int i = 0; i < n; i++) {\n      a[i] = sc.nextInt();\n    }\n    // TODO: in tong phan tu mang\n  }\n}",
  two_sum: "import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    int[] a = new int[n];\n    for (int i = 0; i < n; i++) {\n      a[i] = sc.nextInt();\n    }\n    int target = sc.nextInt();\n    // TODO: in ra 2 chi so i j (0-based) hoac -1 -1\n  }\n}",
  bs: "import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    int[] a = new int[n];\n    for (int i = 0; i < n; i++) {\n      a[i] = sc.nextInt();\n    }\n    int target = sc.nextInt();\n    // TODO: tim vi tri dau tien cua target, khong co thi in -1\n  }\n}",
  max_sub: "import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    int[] a = new int[n];\n    for (int i = 0; i < n; i++) {\n      a[i] = sc.nextInt();\n    }\n    // TODO: in tong lon nhat cua day con lien tiep\n  }\n}",
  bfs: "import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    int m = sc.nextInt();\n    // TODO: doc m canh u v, sau do doc s t va in khoang cach ngan nhat BFS\n  }\n}",
  fib: "import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    // TODO: in Fibonacci F(n)\n  }\n}",
  knap: "import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    int W = sc.nextInt();\n    // TODO: doc n cap (w, v) va in gia tri toi uu 0/1 knapsack\n  }\n}",
  lcs: "import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String a = sc.next();\n    String b = sc.next();\n    // TODO: in do dai LCS cua a va b\n  }\n}"
}

const JAVA_SOLUTION: Record<string, string> = {
  sum: "import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    long total = 0;\n    for (int i = 0; i < n; i++) {\n      total += sc.nextInt();\n    }\n    System.out.println(total);\n  }\n}",
  two_sum: "import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    int[] a = new int[n];\n    for (int i = 0; i < n; i++) {\n      a[i] = sc.nextInt();\n    }\n    int target = sc.nextInt();\n\n    Map<Integer, Integer> seen = new HashMap<>();\n    int first = -1;\n    int second = -1;\n\n    for (int i = 0; i < n; i++) {\n      int x = a[i];\n      int y = target - x;\n      if (seen.containsKey(y)) {\n        first = seen.get(y);\n        second = i;\n        break;\n      }\n      if (!seen.containsKey(x)) {\n        seen.put(x, i);\n      }\n    }\n\n    System.out.println(first + \" \" + second);\n  }\n}",
  bs: "import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    int[] a = new int[n];\n    for (int i = 0; i < n; i++) {\n      a[i] = sc.nextInt();\n    }\n    int target = sc.nextInt();\n\n    int l = 0;\n    int r = n - 1;\n    int ans = -1;\n\n    while (l <= r) {\n      int m = l + (r - l) / 2;\n      if (a[m] >= target) {\n        if (a[m] == target) {\n          ans = m;\n        }\n        r = m - 1;\n      } else {\n        l = m + 1;\n      }\n    }\n\n    System.out.println(ans);\n  }\n}",
  max_sub: "import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    long[] a = new long[n];\n    for (int i = 0; i < n; i++) {\n      a[i] = sc.nextLong();\n    }\n\n    long cur = a[0];\n    long best = a[0];\n    for (int i = 1; i < n; i++) {\n      cur = Math.max(a[i], cur + a[i]);\n      best = Math.max(best, cur);\n    }\n\n    System.out.println(best);\n  }\n}",
  bfs: "import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    int m = sc.nextInt();\n\n    List<Integer>[] g = new ArrayList[n + 1];\n    for (int i = 1; i <= n; i++) {\n      g[i] = new ArrayList<>();\n    }\n\n    for (int i = 0; i < m; i++) {\n      int u = sc.nextInt();\n      int v = sc.nextInt();\n      g[u].add(v);\n      g[v].add(u);\n    }\n\n    int s = sc.nextInt();\n    int t = sc.nextInt();\n\n    int[] dist = new int[n + 1];\n    Arrays.fill(dist, -1);\n    Queue<Integer> q = new ArrayDeque<>();\n    dist[s] = 0;\n    q.add(s);\n\n    while (!q.isEmpty()) {\n      int u = q.poll();\n      for (int v : g[u]) {\n        if (dist[v] == -1) {\n          dist[v] = dist[u] + 1;\n          q.add(v);\n        }\n      }\n    }\n\n    System.out.println(dist[t]);\n  }\n}",
  fib: "import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n\n    if (n <= 1) {\n      System.out.println(n);\n      return;\n    }\n\n    long a = 0;\n    long b = 1;\n    for (int i = 2; i <= n; i++) {\n      long c = a + b;\n      a = b;\n      b = c;\n    }\n\n    System.out.println(b);\n  }\n}",
  knap: "import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    int n = sc.nextInt();\n    int W = sc.nextInt();\n\n    int[] dp = new int[W + 1];\n    for (int i = 0; i < n; i++) {\n      int w = sc.nextInt();\n      int v = sc.nextInt();\n      for (int c = W; c >= w; c--) {\n        dp[c] = Math.max(dp[c], dp[c - w] + v);\n      }\n    }\n\n    System.out.println(dp[W]);\n  }\n}",
  lcs: "import java.util.*;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner sc = new Scanner(System.in);\n    String a = sc.next();\n    String b = sc.next();\n\n    int n = a.length();\n    int m = b.length();\n    int[][] dp = new int[n + 1][m + 1];\n\n    for (int i = 1; i <= n; i++) {\n      for (int j = 1; j <= m; j++) {\n        if (a.charAt(i - 1) == b.charAt(j - 1)) {\n          dp[i][j] = dp[i - 1][j - 1] + 1;\n        } else {\n          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);\n        }\n      }\n    }\n\n    System.out.println(dp[n][m]);\n  }\n}"
}

const CODING_ROTATION: Array<[string, string, string]> = [
  ['sum', 'two_sum', 'bs'],
  ['max_sub', 'two_sum', 'sum'],
  ['bfs', 'bs', 'sum'],
  ['fib', 'knap', 'lcs']
]

const pickProblems = (chapterIndex: number): [Problem, Problem, Problem] => {
  const keys = CODING_ROTATION[chapterIndex % CODING_ROTATION.length]
  return [P[keys[0]], P[keys[1]], P[keys[2]]]
}

const u = <T>(raw: Envelope<T> | T): T => ((raw && typeof raw === 'object' && 'data' in raw ? (raw as Envelope<T>).data : raw) as T)
const arr = <T>(v: unknown, keys: string[]) => (Array.isArray(v) ? (v as T[]) : keys.map((k) => (v as Record<string, unknown>)?.[k]).find(Array.isArray) as T[] || [])
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const norm = (s: string) => s.trim().toLowerCase()

class Api {
  private c: AxiosInstance
  private lastRequestAt = 0
  constructor(base: string, token: string) {
    this.c = axios.create({ baseURL: base, timeout: 45000, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } })
  }

  private async throttle() {
    if (MIN_REQUEST_INTERVAL_MS <= 0) return
    const now = Date.now()
    const elapsed = now - this.lastRequestAt
    if (elapsed < MIN_REQUEST_INTERVAL_MS) {
      await sleep(MIN_REQUEST_INTERVAL_MS - elapsed)
    }
    this.lastRequestAt = Date.now()
  }

  private computeRetryDelayMs(error: AxiosError, attempt: number) {
    const status = Number(error.response?.status)
    const headers = error.response?.headers as Record<string, string | string[] | undefined> | undefined
    const body = error.response?.data as { meta?: { retryAfter?: number | string; resetTime?: string }; message?: string } | undefined

    if (status === 429) {
      const retryAfterHeader = headers?.['retry-after']
      const retryAfterValue = Array.isArray(retryAfterHeader) ? retryAfterHeader[0] : retryAfterHeader
      if (retryAfterValue) {
        const retrySeconds = Number.parseFloat(retryAfterValue)
        if (Number.isFinite(retrySeconds)) return Math.max(500, Math.ceil(retrySeconds * 1000))
        const retryDate = Date.parse(retryAfterValue)
        if (!Number.isNaN(retryDate)) return Math.max(500, retryDate - Date.now())
      }

      const resetTime = body?.meta?.resetTime ? Date.parse(body.meta.resetTime) : Number.NaN
      if (!Number.isNaN(resetTime)) return Math.max(500, resetTime - Date.now())

      const retryAfterMeta = body?.meta?.retryAfter
      if (typeof retryAfterMeta === 'number' && Number.isFinite(retryAfterMeta)) {
        const nowSec = Math.floor(Date.now() / 1000)
        if (retryAfterMeta > nowSec + 5) {
          return Math.max(500, (retryAfterMeta - nowSec) * 1000)
        }
        return Math.max(500, retryAfterMeta * 1000)
      }
    }

    const exponential = RETRY_BASE_MS * Math.pow(2, attempt - 1)
    return Math.min(30000, exponential)
  }

  private async r<T>(m: Method, url: string, data?: unknown, params?: Record<string, unknown>): Promise<T> {
    let last: unknown = null
    const attempts = Math.max(1, MAX_RETRIES)
    for (let i = 1; i <= attempts; i++) {
      try {
        await this.throttle()
        return (await this.c.request<T>({ method: m, url, data, params })).data
      } catch (e) {
        last = e
        const s = (e as AxiosError).response?.status
        if (![429, 500, 502, 503, 504].includes(Number(s)) || i === attempts) break
        if (axios.isAxiosError(e)) {
          const waitMs = this.computeRetryDelayMs(e, i)
          console.warn(`Retry ${i}/${attempts} for ${m} ${url} after ${waitMs}ms (status=${s ?? 'UNKNOWN'})`)
          await sleep(waitMs)
          continue
        }
      }
    }
    if (axios.isAxiosError(last)) {
      const s = last.response?.status
      const body = last.response?.data as { message?: string } | undefined
      throw new Error(`API ${m} ${url} failed (${s ?? 'UNKNOWN'}): ${body?.message || last.message}`)
    }
    throw last instanceof Error ? last : new Error(`API ${m} ${url} failed`)
  }
  me = async () => u(await this.r<Envelope<{ userPermissions?: string[]; username?: string; email?: string }>>('GET', '/auth/me'))
  categoriesAll = async () => arr<Category>(u(await this.r<Envelope<{ categories: Category[] }>>('GET', '/categories/all')), ['categories'])
  createCategory = async (x: Record<string, unknown>): Promise<Category> => {
    const d = u(await this.r<Envelope<{ category: Category } | Category>>('POST', '/categories', x))
    if (d && typeof d === 'object' && 'category' in d) return (d as { category: Category }).category
    return d as Category
  }
  courseBySlug = async (slug: string): Promise<Course | null> => { try { return u(await this.r<Envelope<Course>>('GET', `/courses/slug/${slug}`)) as Course } catch (e) { if (e instanceof Error && e.message.includes('(404)')) return null; throw e } }
  createCourse = async (x: Record<string, unknown>): Promise<Course> => {
    const d = u(await this.r<Envelope<{ course: Course } | Course>>('POST', '/courses', x))
    if (d && typeof d === 'object' && 'course' in d) return (d as { course: Course }).course
    return d as Course
  }
  updateCourse = async (id: string, x: Record<string, unknown>) => { await this.r('PUT', `/courses/${id}`, x) }
  chaptersByCourse = async (courseId: string) => arr<Chapter>(u(await this.r<Envelope<Chapter[] | { chapters: Chapter[] }>>('GET', '/chapters', undefined, { courseId })), ['chapters'])
  createChapter = async (x: Record<string, unknown>) => u(await this.r<Envelope<Chapter>>('POST', '/chapters', x))
  lessonsByChapter = async (id: string) => arr<Lesson>(u(await this.r<Envelope<{ lessons: Lesson[] }>>('GET', `/lessons/chapter/${id}`)), ['lessons'])
  createLesson = async (x: Record<string, unknown>) => { await this.r('POST', '/lessons', x) }
  updateLesson = async (id: string, x: Record<string, unknown>) => { await this.r('PUT', `/lessons/${id}`, x) }
  runtimes = async () => u(await this.r<Envelope<Runtime[]>>('GET', '/lessons/coding/runtimes'))
  publicChapters = async (courseId: string) => arr<Chapter>(u(await this.r<Envelope<{ chapters: Chapter[] }>>('GET', `/chapters/course/${courseId}`)), ['chapters'])
}

const RUNTIME_PRIORITIES: Record<string, string[]> = {
  java: ['17.0.0', '15.0.2', '11.0.0'],
  python: ['3.12.0', '3.11.0', '3.10.0']
}

const pickRuntime = (rs: Runtime[]) => {
  const runtime = rs.find((r) => r.language.toLowerCase() === CODING_LANGUAGE) || rs.find((r) => r.aliases.some((a) => a.toLowerCase() === CODING_LANGUAGE))
  if (!runtime) {
    const sample = rs.slice(0, 12).map((r) => r.language).join(', ')
    throw new Error(`Runtime "${CODING_LANGUAGE}" not found. Available sample: ${sample}`)
  }
  if (runtime.versions.length === 0) throw new Error(`Runtime "${runtime.language}" has no available version`)

  if (CODING_VERSION) {
    if (!runtime.versions.includes(CODING_VERSION)) {
      throw new Error(`Version "${CODING_VERSION}" is not available for runtime "${runtime.language}". Available: ${runtime.versions.join(', ')}`)
    }
    return { language: runtime.language, version: CODING_VERSION }
  }

  const preferredVersions = RUNTIME_PRIORITIES[CODING_LANGUAGE] || []
  const version = preferredVersions.find((v) => runtime.versions.includes(v)) || runtime.versions[0]
  return { language: runtime.language, version }
}

const resolveCodingCode = (problem: Problem, runtimeLanguage: string) => {
  if (runtimeLanguage.toLowerCase() === 'java') {
    const starterCode = JAVA_STARTER[problem.key]
    const solutionCode = JAVA_SOLUTION[problem.key]
    if (!starterCode || !solutionCode) throw new Error(`Missing Java template for problem key "${problem.key}"`)
    return { starterCode, solutionCode }
  }

  return {
    starterCode: problem.starterCode,
    solutionCode: problem.solutionCode
  }
}

const article = (course: string, chapter: string, part: 1 | 2) => [`## ${part === 1 ? 'Kiến thức cốt lõi' : 'Mẫu tư duy'}`, '', `Khóa: **${course}**`, `Chương: **${chapter}**`, '', '### Ứng dụng cho sinh viên FPT Polytechnic', '- Tối ưu bài tập và đồ án.', '- Rèn tư duy trước khi code.', '', '### Bài tập tự luyện', '- Tự tạo 3 test case biên.', '- So sánh 2 cách giải và ghi Big-O.'].join('\n')
const video = (course: string, chapter: string) => [`Video hướng dẫn chương **${chapter}** trong khóa **${course}**.`, '', 'Nội dung: lý thuyết trọng tâm, walkthrough, checklist debug.'].join('\n')
const statement = (p: Problem, chapter: string) => [`## ${p.title}`, '', `Chủ đề: **${chapter}**`, '', '### Input', p.inputSpec, '', '### Output', p.outputSpec, '', '### Ví dụ', `Input:\n${p.vIn}`, '', `Output:\n${p.vOut}`].join('\n')

async function main() {
  console.log(`Provision DSA VN -> ${API_URL} (dry=${DRY}, update=${UPDATE})`)
  if (!TOKEN) throw new Error('Missing PROVISION_API_TOKEN')
  const api = new Api(API_URL, TOKEN)
  const me = await api.me()
  const miss = NEED.filter((p) => !(me.userPermissions || []).includes(p))
  if (miss.length) throw new Error(`Missing permissions: ${miss.join(', ')}`)
  console.log(`Token owner: ${me.username || me.email || 'unknown'}`)
  const runtime = pickRuntime(await api.runtimes())
  console.log(`Runtime: ${runtime.language} ${runtime.version}`)

  let category = (await api.categoriesAll()).find((c) => c.slug === CAT.slug || norm(c.name) === norm(CAT.name))
  if (!category) {
    if (DRY) { category = { _id: 'DRY_CAT', ...CAT }; console.log('DRY create category') }
    else {
      try {
        category = await api.createCategory(CAT)
        console.log(`Created category ${category._id}`)
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        if (!msg.toLowerCase().includes('already exists')) throw e
        const categories = await api.categoriesAll()
        category = categories.find((c) => c.slug === CAT.slug || norm(c.name) === norm(CAT.name))
        if (!category) {
          throw new Error(`Category already exists but cannot be resolved by slug/name: ${CAT.slug} / ${CAT.name}`)
        }
        console.log(`Reuse existing category after create conflict: ${category._id}`)
      }
    }
  } else console.log(`Reuse category ${category._id}`)

  const stat = { courseCreated: 0, courseUpdated: 0, courseSkipped: 0, chapterCreated: 0, chapterSkipped: 0, lessonCreated: 0, lessonUpdated: 0, lessonSkipped: 0 }

  for (const c of COURSES) {
    let course = await api.courseBySlug(c.slug)
    const payloadCourse = {
      title: c.title, slug: c.slug, image: c.image, description: `Khóa học ${c.title} cho cộng đồng sinh viên Việt Nam.`,
      excerpt: `Lộ trình ${c.title} bằng tiếng Việt, tập trung thực hành.`, introUrl: VIDEO_URL, price: 0, oldPrice: 0, originalPrice: 0, isFree: true,
      status: 'published', categoryId: category._id, level: c.level,
      info: { requirements: ['Biết lập trình cơ bản'], benefits: ['Tăng kỹ năng giải bài DSA'], techniques: ['Phân tích', 'Tối ưu', 'Thực hành'], documents: ['Checklist học tập'], qa: [{ question: 'Học theo thứ tự nào?', answer: 'Học tuần tự theo chapter, ưu tiên làm coding mỗi bài.' }] }
    }
    if (!course) {
      if (DRY) { course = { _id: `DRY_${c.slug}`, slug: c.slug, title: c.title }; console.log(`DRY create course ${c.slug}`) }
      else { course = await api.createCourse(payloadCourse); stat.courseCreated++; console.log(`Created course: ${course.title}`); await sleep(DELAY) }
    } else if (UPDATE && !DRY) { await api.updateCourse(course._id, payloadCourse); stat.courseUpdated++; console.log(`Updated course: ${course.title}`); await sleep(DELAY) }
    else { stat.courseSkipped++; console.log(`Skip course: ${course.title}`) }

    const chapterNames = CHAPTERS[c.slug]
    const chaptersEx = DRY ? [] : await api.chaptersByCourse(course._id)
    for (let i = 0; i < 4; i++) {
      const chapterName = chapterNames[i]
      let chapter = chaptersEx.find((x) => x.title === chapterName)
      if (!chapter) {
        if (DRY) { chapter = { _id: `DRY_${course.slug}_${i}`, title: chapterName }; console.log(`  DRY create chapter ${chapterName}`) }
        else { chapter = await api.createChapter({ title: chapterName, description: `Nội dung trọng tâm: ${chapterName}.`, courseId: course._id, isPublished: true }); stat.chapterCreated++; console.log(`  Created chapter: ${chapterName}`); await sleep(DELAY) }
      } else { stat.chapterSkipped++; console.log(`  Skip chapter: ${chapterName}`) }

      const lessonsEx = DRY ? [] : await api.lessonsByChapter(chapter._id)
      const [p1, p2, p3] = pickProblems(i)
      const plan: Array<Record<string, unknown>> = [
        { title: `Bài đọc 1: ${chapterName} - Kiến thức cốt lõi`, contentType: 'article', preview: i === 0, isPublished: true, duration: 15, resource: { description: article(c.title, chapterName, 1) } },
        { title: `Bài đọc 2: ${chapterName} - Mẫu tư duy`, contentType: 'article', preview: false, isPublished: true, duration: 15, resource: { description: article(c.title, chapterName, 2) } },
        { title: `Video: ${chapterName}`, contentType: 'video', preview: false, isPublished: true, duration: 20, resource: { url: VIDEO_URL, description: video(c.title, chapterName) } },
        ...[p1, p2, p3].map((p, idx) => {
          const codingCode = resolveCodingCode(p, runtime.language)
          return {
            title: `Bài tập code ${idx + 1}: ${p.title}`,
            contentType: 'coding',
            preview: false,
            isPublished: true,
            duration: 30,
            resource: {
              title: p.title,
              language: runtime.language,
              version: runtime.version,
              problemStatement: statement(p, chapterName),
              starterCode: codingCode.starterCode,
              solutionCode: codingCode.solutionCode,
              testCases: [{ input: p.vIn, expectedOutput: p.vOut, isHidden: false }, { input: p.h1In, expectedOutput: p.h1Out, isHidden: true }, { input: p.h2In, expectedOutput: p.h2Out, isHidden: true }],
              constraints: { timeLimit: 2, memoryLimit: 128 }
            }
          }
        })
      ]
      for (const x of plan) {
        const title = String(x.title); const type = x.contentType as Lesson['contentType']; const ex = lessonsEx.find((l) => l.title === title)
        if (!ex) {
          if (DRY) console.log(`    DRY create lesson: ${title}`)
          else { await api.createLesson({ title, chapterId: chapter._id, courseId: course._id, contentType: type, preview: x.preview, isPublished: x.isPublished, duration: x.duration, resource: x.resource }); stat.lessonCreated++; console.log(`    Created lesson: ${title}`); await sleep(DELAY) }
        } else if (ex.contentType !== type) { stat.lessonSkipped++; console.log(`    Skip type mismatch: ${title}`) }
        else if (UPDATE && !DRY) { await api.updateLesson(ex._id, { title, preview: x.preview, isPublished: x.isPublished, duration: x.duration, resource: x.resource }); stat.lessonUpdated++; console.log(`    Updated lesson: ${title}`); await sleep(DELAY) }
        else { stat.lessonSkipped++; console.log(`    Skip lesson: ${title}`) }
      }
    }
  }

  if (DRY) {
    console.log('SUMMARY', stat, 'qa skipped (dry-run)')
    console.log('Provision dry-run completed successfully.')
    return
  }

  let qaFail = 0
  for (const c of COURSES) {
    const course = await api.courseBySlug(c.slug)
    if (!course) { qaFail++; console.log(`QA fail missing course ${c.slug}`); continue }
    const chapters = await api.publicChapters(course._id)
    if (chapters.length < 4) { qaFail++; console.log(`QA fail ${c.slug} has ${chapters.length} chapter(s)`); continue }
    const lessons = await api.lessonsByChapter(chapters[0]._id)
    if (lessons.length < 6) { qaFail++; console.log(`QA fail ${c.slug} first chapter has ${lessons.length} lesson(s)`) }
  }

  console.log('SUMMARY', stat, `qaFail=${qaFail}`)
  if (qaFail > 0) throw new Error(`Provision finished with ${qaFail} QA failure(s)`)
  console.log('Provision completed successfully.')
}

main().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exit(1) })
