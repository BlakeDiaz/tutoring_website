DROP TABLE Bookings;
DROP TABLE Users;
DROP TABLE AppointmentTimeSlots;

CREATE TABLE Users (
    userID SERIAL PRIMARY KEY,
    email VARCHAR(254) NOT NULL,
    passwordSaltedHashed BYTEA NOT NULL
);

CREATE TABLE AppointmentTimeSlots (
    appointmentID SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    hour24 INT NOT NULL,
    capacity INT NOT NULL
);

/* TODO add building name here */
CREATE TABLE Bookings (
    appointmentID INT REFERENCES AppointmentTimeSlots,
    userID INT REFERENCES Users,
    subject VARCHAR(512) NOT NULL,
    location VARCHAR(512) NOT NULL,
    comments VARCHAR(512) NOT NULL
);