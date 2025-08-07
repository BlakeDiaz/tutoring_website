def validate_date(date_str: str) -> bool:
    if len(date_str) != 10:
        return False
    year_month_day = date_str.split("-")
    if len(year_month_day) != 3:
        return False
    year_str, month_str, day_str = year_month_day
    if len(year_str) != 4 or len(month_str) != 2 or len(day_str) != 2:
        return False
    try:
        year = int(year_str)
        month = int(month_str)
        day = int(day_str)

        if year < 0:
            return False
        if month < 0 or month > 12:
            return False
        if day < 0 or day > 31:
            return False
    except ValueError as e:
        return False

    return True


def validate_hour_24(hour_24_str: str) -> bool:
    try:
        hour_24 = int(hour_24_str)
    except ValueError as e:
        return False
    if hour_24 < 0 or hour_24 > 23:
        return False

    return True


def validate_capacity(capacity_str: str) -> bool:
    try:
        capacity = int(capacity_str)
    except ValueError as e:
        return False
    if capacity < 1:
        return False

    return True
