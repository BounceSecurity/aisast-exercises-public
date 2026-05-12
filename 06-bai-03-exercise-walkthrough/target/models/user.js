// User model. Fields email, ssn, dateOfBirth and phoneNumber are
// considered PII and must NEVER leave our systems via a third-party
// integration. Use toPublicJson() to strip them before sending.

class User {
  constructor({ id, name, email, ssn, dateOfBirth, phoneNumber, country, signupDate }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.ssn = ssn;
    this.dateOfBirth = dateOfBirth;
    this.phoneNumber = phoneNumber;
    this.country = country;
    this.signupDate = signupDate;
  }

  // Returns a copy with PII fields removed. Safe to send to third
  // parties.
  toPublicJson() {
    return {
      id: this.id,
      name: this.name,
      country: this.country,
      signupDate: this.signupDate,
    };
  }
}

// Toy in-memory loader. Pretend this hits a database.
function loadUser(id) {
  return new User({
    id,
    name: "Jane Doe",
    email: "jane@example.com",
    ssn: "123-45-6789",
    dateOfBirth: "1990-04-12",
    phoneNumber: "+1-555-0100",
    country: "US",
    signupDate: "2024-01-15",
  });
}

module.exports = { User, loadUser };
