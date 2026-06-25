UPDATE users SET password_hash='scrypt:32768:8:1$4NLAoWdSVtVH7lM4$2311b337baab0bb92a224ac96d990793be851d72710dde953f1d7301140bb11d7a037a05108c4f3e3645fb0423fe8fa6cc25cfeec3b12a6ae399362bdedb2811' WHERE email='admin@example.com';
SELECT email, password_hash FROM users WHERE email='admin@example.com';
