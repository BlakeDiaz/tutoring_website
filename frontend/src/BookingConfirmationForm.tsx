function BookingConfirmationForm() {
  return (
    <form action="/api/book/confirm_booking" method="post">
      <h1>Confirm Your Appointment</h1>
      <label htmlFor="subject">What subject would you like to cover?</label>
      <br />
      <input type="text" id="subject" name="subject" required />
      <br />
      <label htmlFor="location">Where on campus would you like to meet?</label>
      <br />
      <input type="text" id="location" name="location" required />
      <br />
      <label htmlFor="comments">Any additional comments?</label>
      <br />
      <input type="text" id="comments" name="comments" />
      <br />
      <input type="submit" value="Submit" />
    </form>
  );
}

export default BookingConfirmationForm;
