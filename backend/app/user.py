class User:
    def __init__(self, user_id: int, name: str, email: str):
        self.user_id = user_id
        self.name = name
        self.email = email

    def format_to_dict_for_sending(self):
        return {"name": self.name, "email": self.email}

    def __repr__(self):
        return (
            f"User: <user_id: {self.user_id}, name: {self.name}, email: {self.email}>"
        )
