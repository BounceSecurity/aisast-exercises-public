const axios = require("axios");

// OK: the host is hardcoded, only the user's avatar id flows in.
// Even if the id is weird, axios resolves against api.example.com.
async function fetchAvatar(req, res) {
  const id = req.params.id;
  const r = await axios.get(`https://api.example.com/avatars/${id}`);
  res.send(r.data);
}

module.exports = { fetchAvatar };
