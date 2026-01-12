import puppeteer from 'puppeteer'
import chromium from 'chrome-aws-lambda'
import { IOrder } from '../models/order'
import dotenv from 'dotenv'
dotenv.config()

interface InvoiceData {
  order: IOrder
  user: {
    username: string
    email: string
  }
  companyInfo: {
    name: string
    address: string
    phone: string
    email: string
    website: string
  }
}

export class PDFService {
  /**
   * Generate invoice HTML template
   */
  private static generateInvoiceHTML(data: InvoiceData): string {
    const { order, user, companyInfo } = data

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice ${order.code}</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Arial', sans-serif;
                font-size: 14px;
                line-height: 1.6;
                color: #333;
                background-color: #fff;
            }
            
            .invoice-container {
                max-width: 800px;
                margin: 0 auto;
                padding: 40px;
                background: white;
            }
            
            .invoice-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 40px;
                border-bottom: 2px solid #eee;
                padding-bottom: 20px;
            }
            
            .company-info h1 {
                color: #2563eb;
                font-size: 32px;
                margin-bottom: 10px;
            }
            
            .company-info p {
                margin: 2px 0;
                color: #666;
            }
            
            .invoice-info {
                text-align: right;
            }
            
            .invoice-info h2 {
                color: #333;
                font-size: 28px;
                margin-bottom: 10px;
            }
            
            .invoice-info p {
                margin: 5px 0;
            }
            
            .billing-section {
                display: flex;
                justify-content: space-between;
                margin-bottom: 40px;
            }
            
            .billing-info h3 {
                color: #333;
                margin-bottom: 15px;
                font-size: 18px;
            }
            
            .billing-info p {
                margin: 5px 0;
                color: #666;
            }
            
            .order-details {
                margin-bottom: 30px;
            }
            
            .order-details h3 {
                color: #333;
                margin-bottom: 15px;
                font-size: 18px;
            }
            
            .order-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 30px;
            }
            
            .order-table th,
            .order-table td {
                padding: 15px;
                text-align: left;
                border-bottom: 1px solid #eee;
            }
            
            .order-table th {
                background-color: #f8fafc;
                font-weight: 600;
                color: #374151;
                border-bottom: 2px solid #e5e7eb;
            }
            
            .order-table tr:hover {
                background-color: #f9fafb;
            }
            
            .text-right {
                text-align: right;
            }
            
            .price {
                font-weight: 600;
                color: #059669;
            }
            
            .totals-section {
                max-width: 400px;
                margin-left: auto;
                margin-bottom: 40px;
            }
            
            .totals-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
            }
            
            .totals-row.total {
                font-weight: 600;
                font-size: 18px;
                border-bottom: 2px solid #333;
                color: #333;
                margin-top: 10px;
            }
            
            .footer {
                margin-top: 40px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                text-align: center;
                color: #666;
                font-size: 12px;
            }
            
            .status-badge {
                display: inline-block;
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 600;
                text-transform: uppercase;
            }
            
            .status-pending {
                background-color: #fef3c7;
                color: #d97706;
            }
            
            .status-completed {
                background-color: #d1fae5;
                color: #065f46;
            }
            
            .status-cancelled {
                background-color: #fee2e2;
                color: #dc2626;
            }
            
            .coupon-info {
                background-color: #f0f9ff;
                border: 1px solid #0ea5e9;
                border-radius: 8px;
                padding: 10px 15px;
                margin: 10px 0;
                color: #0c4a6e;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="invoice-container">
            <!-- Header -->
            <div class="invoice-header">
                <div class="company-info">
                    <h1>${companyInfo.name}</h1>
                    <p>${companyInfo.address}</p>
                    <p>Phone: ${companyInfo.phone}</p>
                    <p>Email: ${companyInfo.email}</p>
                    <p>Website: ${companyInfo.website}</p>
                </div>
                <div class="invoice-info">
                    <h2>INVOICE</h2>
                    <p><strong>Invoice #:</strong> ${order.code}</p>
                    <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
                    <p><strong>Status:</strong> 
                        <span class="status-badge status-${order.status.toLowerCase()}">
                            ${order.status}
                        </span>
                    </p>
                </div>
            </div>

            <!-- Billing Information -->
            <div class="billing-section">
                <div class="billing-info">
                    <h3>Bill To:</h3>
                    <p><strong>${user.username}</strong></p>
                    <p>${user.email}</p>
                </div>
                <div class="billing-info">
                    <h3>Payment Method:</h3>
                    <p>${order.paymentMethod.toUpperCase()}</p>
                    ${
                      order.couponCode
                        ? `
                        <div class="coupon-info">
                            <strong>Coupon Applied:</strong> ${order.couponCode}
                        </div>
                    `
                        : ''
                    }
                </div>
            </div>

            <!-- Order Details -->
            <div class="order-details">
                <h3>Course Details</h3>
                <table class="order-table">
                    <thead>
                        <tr>
                            <th>Course</th>
                            <th class="text-right">Price</th>
                            ${order.items.some((item) => item.oldPrice) ? '<th class="text-right">Original Price</th>' : ''}
                        </tr>
                    </thead>
                    <tbody>
                        ${order.items
                          .map(
                            (item) => `
                            <tr>
                                <td>
                                    <strong>${item.title}</strong>
                                </td>
                                <td class="text-right price">${item.price.toLocaleString('vi-VN')} VND</td>
                                ${item.oldPrice ? `<td class="text-right" style="text-decoration: line-through; color: #999;">${item.oldPrice.toLocaleString('vi-VN')} VND</td>` : order.items.some((i) => i.oldPrice) ? '<td></td>' : ''}
                            </tr>
                        `
                          )
                          .join('')}
                    </tbody>
                </table>
            </div>

            <!-- Totals -->
            <div class="totals-section">
                <div class="totals-row">
                    <span>Subtotal:</span>
                    <span class="price">${order.subTotal.toLocaleString('vi-VN')} VND</span>
                </div>
                ${
                  order.totalDiscount > 0
                    ? `
                    <div class="totals-row">
                        <span>Discount:</span>
                        <span style="color: #dc2626;">-${order.totalDiscount.toLocaleString('vi-VN')} VND</span>
                    </div>
                `
                    : ''
                }
                <div class="totals-row total">
                    <span>Total Amount:</span>
                    <span class="price">${order.totalAmount.toLocaleString('vi-VN')} VND</span>
                </div>
            </div>

            <!-- Footer -->
            <div class="footer">
                <p>Thank you for your purchase!</p>
                <p>This invoice was generated on ${new Date().toLocaleDateString()}</p>
                <p>For any questions, please contact us at ${companyInfo.email}</p>
            </div>
        </div>
    </body>
    </html>
    `
  }

  /**
   * Generate PDF buffer from order data
   */
  static async generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
    // Simple approach: detect if we're in production
    const isProduction = process.env.NODE_ENV === 'production'
    console.log('isProduction:', isProduction)

    const browser = await puppeteer.launch({
      headless: true,
      args: isProduction
        ? chromium.args
        : ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
      executablePath: isProduction ? await chromium.executablePath : undefined
    })

    try {
      const page = await browser.newPage()
      const html = this.generateInvoiceHTML(data)

      await page.setContent(html, {
        waitUntil: 'networkidle0'
      })

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        }
      })

      return Buffer.from(pdfBuffer)
    } finally {
      await browser.close()
    }
  }

  /**
   * Get default company information (this could come from environment variables or database)
   */
  static getDefaultCompanyInfo() {
    return {
      name: process.env.COMPANY_NAME || 'EduNova Learning Platform',
      address: process.env.COMPANY_ADDRESS || '123 Education Street, Learning City, LC 12345',
      phone: process.env.COMPANY_PHONE || '+1 (555) 123-4567',
      email: process.env.COMPANY_EMAIL || 'support@edunova.com',
      website: process.env.COMPANY_WEBSITE || 'www.edunova.com'
    }
  }
}
