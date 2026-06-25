import os
import pymysql

# Railway MySQL connection
conn = pymysql.connect(
    host=os.environ.get('MYSQLHOST'),
    port=int(os.environ.get('MYSQLPORT', 3306)),
    user=os.environ.get('MYSQLUSER'),
    password=os.environ.get('MYSQLPASSWORD'),
    database=os.environ.get('MYSQLDATABASE'),
)

cursor = conn.cursor()

# Find order_items where image URL is old local path
# Update to use the product's current Cloudinary URL
cursor.execute("""
    UPDATE order_items oi
    JOIN products p ON oi.product_id = p.id
    SET oi.image_url = p.image_url
    WHERE oi.image_url LIKE '/uploads/%'
""")

updated = cursor.rowcount
conn.commit()
cursor.close()
conn.close()

print(f"Fixed {updated} order item image URLs.")
