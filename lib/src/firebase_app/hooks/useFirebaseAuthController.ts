import { useCallback, useEffect, useState } from "react";

import {
    ApplicationVerifier,
    Auth,
    FacebookAuthProvider,
    fetchSignInMethodsForEmail,
    getAuth,
    GithubAuthProvider,
    GoogleAuthProvider,
    OAuthProvider,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPhoneNumber,
    signInWithPopup,
    signOut,
    TwitterAuthProvider,
    User as FirebaseUser
} from "firebase/auth";
import { FirebaseApp } from "firebase/app";
import { AuthController } from "../../models";
import {
    FirebaseAuthController,
    FirebaseSignInOption,
    FirebaseSignInProvider
} from "../models/auth";
import {
    ConfirmationResult,
    createUserWithEmailAndPassword,
    signInAnonymously
} from "@firebase/auth";

interface FirebaseAuthHandlerProps {
    firebaseApp?: FirebaseApp;
    signInOptions: Array<FirebaseSignInProvider | FirebaseSignInOption>;
}

/**
 * Use this hook to build an {@link AuthController} based on Firebase Auth
 * @category Firebase
 */
export const useFirebaseAuthController = (
    {
        firebaseApp,
        signInOptions
    }: FirebaseAuthHandlerProps): FirebaseAuthController => {

    const [loggedUser, setLoggedUser] = useState<FirebaseUser | null | undefined>(undefined); // logged user, anonymous or logged out
    const [authProviderError, setAuthProviderError] = useState<any>();
    const [initialLoading, setInitialLoading] = useState(true);
    const [authLoading, setAuthLoading] = useState(true);
    const [loginSkipped, setLoginSkipped] = useState<boolean>(false);
    const [confirmationResult, setConfirmationResult] = useState<void | ConfirmationResult>();

    const [extra, setExtra] = useState<any>();

    function skipLogin() {
        setLoginSkipped(true);
        setLoggedUser(null);
    }

    useEffect(() => {
        if (!firebaseApp) return;
        const auth = getAuth(firebaseApp);
        setLoggedUser(auth.currentUser)
        return onAuthStateChanged(
            auth,
            updateFirebaseUser,
            error => setAuthProviderError(error)
        );
    }, [firebaseApp]);

    const updateFirebaseUser = useCallback(async (firebaseUser: FirebaseUser | null) => {
        setLoggedUser(firebaseUser);
        setInitialLoading(false);
        setAuthLoading(false);
    }, []);

    const onSignOut = useCallback(() => {
        const auth = getAuth(firebaseApp);
        signOut(auth)
            .then(_ => {
                setLoggedUser(null);
                setAuthProviderError(null);
            });
        setLoginSkipped(false);
    }, [firebaseApp]);

    const getProviderOptions = useCallback((providerId: FirebaseSignInProvider): FirebaseSignInOption | undefined => {
        return signInOptions.find((option) => {
            if (option === null) throw Error("useFirebaseAuthController");
            if (typeof option === "object" && option.provider === providerId)
                return option as FirebaseSignInOption;
            return undefined;
        }) as FirebaseSignInOption | undefined;
    }, [signInOptions]);

    const googleLogin = useCallback(() => {
        const provider = new GoogleAuthProvider();
        const options = getProviderOptions("google.com");
        if (options?.scopes)
            options.scopes.forEach((scope) => provider.addScope(scope));
        if (options?.customParameters)
            provider.setCustomParameters(options.customParameters);
        const auth = getAuth();
        signInWithPopup(auth, provider).catch(setAuthProviderError);
    }, [getProviderOptions]);

    const doOauthLogin = useCallback((auth: Auth, provider: OAuthProvider | FacebookAuthProvider | GithubAuthProvider | TwitterAuthProvider) => {
        setAuthLoading(true);
        signInWithPopup(auth, provider)
            .catch(setAuthProviderError).then(() => setAuthLoading(false));
    }, []);

    const anonymousLogin = useCallback(() => {
        const auth = getAuth();
        setAuthLoading(true);
        signInAnonymously(auth)
            .catch(setAuthProviderError)
            .then(() => setAuthLoading(false));
    }, []);

    const phoneLogin = useCallback((phone: string, applicationVerifier: ApplicationVerifier) => {
        const auth = getAuth();
        setAuthLoading(true);
        return signInWithPhoneNumber(auth, phone, applicationVerifier)
            .catch(setAuthProviderError)
            .then((res) => {
                setAuthLoading(false)
                setConfirmationResult(res)
            });
    }, []);

    const appleLogin = useCallback(() => {
        const provider = new OAuthProvider("apple.com");
        const options = getProviderOptions("apple.com");
        if (options?.scopes)
            options.scopes.forEach((scope) => provider.addScope(scope));
        if (options?.customParameters)
            provider.setCustomParameters(options.customParameters);
        const auth = getAuth();
        doOauthLogin(auth, provider);
    }, [doOauthLogin, getProviderOptions]);

    const facebookLogin = useCallback(() => {
        const provider = new FacebookAuthProvider();
        const options = getProviderOptions("facebook.com");
        if (options?.scopes)
            options.scopes.forEach((scope) => provider.addScope(scope));
        if (options?.customParameters)
            provider.setCustomParameters(options.customParameters);
        const auth = getAuth();
        doOauthLogin(auth, provider);
    }, [doOauthLogin, getProviderOptions]);

    const githubLogin = useCallback(() => {
        const provider = new GithubAuthProvider();
        const options = getProviderOptions("github.com");
        if (options?.scopes)
            options.scopes.forEach((scope) => provider.addScope(scope));
        if (options?.customParameters)
            provider.setCustomParameters(options.customParameters);
        const auth = getAuth();
        doOauthLogin(auth, provider);
    }, [doOauthLogin, getProviderOptions]);

    const microsoftLogin = useCallback(() => {
        const provider = new OAuthProvider("microsoft.com");
        const options = getProviderOptions("microsoft.com");
        if (options?.scopes)
            options.scopes.forEach((scope) => provider.addScope(scope));
        if (options?.customParameters)
            provider.setCustomParameters(options.customParameters);
        const auth = getAuth();
        doOauthLogin(auth, provider);
    }, [doOauthLogin, getProviderOptions]);

    const twitterLogin = useCallback(() => {
        const provider = new TwitterAuthProvider();
        const options = getProviderOptions("twitter.com");
        if (options?.customParameters)
            provider.setCustomParameters(options.customParameters);
        const auth = getAuth();
        doOauthLogin(auth, provider);
    }, [doOauthLogin, getProviderOptions]);

    const emailPasswordLogin = useCallback((email: string, password: string) => {
        const auth = getAuth();
        setAuthLoading(true);
        signInWithEmailAndPassword(auth, email, password)
            .catch(setAuthProviderError)
            .then(() => setAuthLoading(false));
    }, []);

    const registerWithPasswordEmail = useCallback((email: string, password: string) => {
        const auth = getAuth();
        setAuthLoading(true);
        createUserWithEmailAndPassword(auth, email, password)
            .catch(setAuthProviderError)
            .then(() => setAuthLoading(false));
    }, []);

    const getSignInMethodsForEmail = useCallback((email: string): Promise<string[]> => {
        const auth = getAuth();
        setAuthLoading(true);
        return fetchSignInMethodsForEmail(auth, email)
            .then((res) => {
                setAuthLoading(false);
                return res;
            });
    }, []);

    return {
        user: loggedUser ?? null,
        authError: authProviderError,
        authLoading,
        initialLoading,
        confirmationResult,
        signOut: onSignOut,
        loginSkipped,
        skipLogin,
        googleLogin,
        anonymousLogin,
        appleLogin,
        facebookLogin,
        githubLogin,
        microsoftLogin,
        twitterLogin,
        emailPasswordLogin,
        phoneLogin,
        fetchSignInMethodsForEmail: getSignInMethodsForEmail,
        createUserWithEmailAndPassword: registerWithPasswordEmail,
        extra,
        setExtra
    };
};
