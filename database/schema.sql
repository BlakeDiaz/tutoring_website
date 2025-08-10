DROP TABLE Bookings;
DROP TABLE UserRoles;
DROP TABLE Users;
DROP TABLE AppointmentTimeSlots;

CREATE TABLE Users (
    userID SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(254) NOT NULL,
    passwordSaltedHashed BYTEA NOT NULL
);

CREATE TABLE UserRoles (
    userID INT REFERENCES Users,
    userRole VARCHAR(32) NOT NULL
);

CREATE TABLE AppointmentTimeSlots (
    appointmentID SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    hour24 INT NOT NULL,
    capacity INT NOT NULL,
    leaderUserID INT REFERENCES Users,
    confirmationCode CHAR(6),
    subject VARCHAR(512),
    location VARCHAR(512)
);

/* TODO add building name here */
CREATE TABLE Bookings (
    appointmentID INT REFERENCES AppointmentTimeSlots,
    userID INT REFERENCES Users,
    bookingTimestamp TIMESTAMP NOT NULL,
    comments VARCHAR(512) NOT NULL
);