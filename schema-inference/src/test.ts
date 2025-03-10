import * as admin from "firebase-admin";
import util from "util";
import {getEntityCollection} from "./collection_builder";

// To set the project credentials
// export GOOGLE_APPLICATION_CREDENTIALS="/users/francesco/medicalmotion-staging.json"
export function initServiceAccountFirestore() {
    console.log("Init script firestore");
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
    const fs = admin.firestore();
    const settings = {timestampsInSnapshots: true};
    fs.settings(settings);
    return fs;
}

initServiceAccountFirestore();
// getEntityCollection("/exercises/*/meditation")
getEntityCollection("/products/")
    .then((res) => console.log(util.inspect(res, false, null, true)));
