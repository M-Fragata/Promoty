import { app } from './app.js';
import { Env } from './utils/Envirolment.js';

app.listen(Env.PORT, () => {
    console.log(`Server is running on port ${Env.PORT}`);
});
