from werkzeug.security import generate_password_hash

password = "AdminPass123"
hashed = generate_password_hash(password)

sql = f"""USE ecommerce_db;
UPDATE users SET password_hash='{hashed}' WHERE email='admin@example.com';
SELECT email, password_hash FROM users WHERE email='admin@example.com';
"""

with open("../database/update_admin.sql", "w") as f:
    f.write(sql)

print("New password hash written to database/update_admin.sql")
print("Password to use for login:", password)