import 'dotenv/config';
import "./db/index.ts";
import {app}  from "./app"

const PORT = process.env.PORT 
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
