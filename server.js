const express = require('express');
const app = express();

app.use(express.static(__dirname + '/dist/maps-project'));

const port = 3003;


app.listen(port, () => {
    console.log(`listening on port ${port}`);
});
