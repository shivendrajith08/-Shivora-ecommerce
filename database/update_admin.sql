USE ecommerce_db;
UPDATE users SET password_hash='scrypt:32768:8:1$KhELZT8AB1Hh0ioF$01daadb9521c461861e87aa25d58e6a08a1d545f65a0b65c6a6d1f7f2c53a7f3e520890a9834d5032067c76c3e3fd47e7210ade83a0977a68b9fe264f5178655' WHERE email='admin@example.com';
SELECT email, password_hash FROM users WHERE email='admin@example.com';
