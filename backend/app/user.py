class User:
    def __init__(self, user_id: int, email: str, password_hashed: str):
        self.user_id = user_id
        self.email = email
        self.password_hashed = password_hashed

    def __repr__(self):
        return f"User: <user_id: {self.user_id}, email: {self.email}, password_hashed: {self.password_hashed}>"
