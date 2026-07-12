from app.auth.password import hash_password

print("admin", hash_password("admin123"))
print("rental", hash_password("rental123"))
print("piling", hash_password("piling123"))
print("om", hash_password("om123"))