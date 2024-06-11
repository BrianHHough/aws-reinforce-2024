"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { CognitoUserPool, CognitoUser, AuthenticationDetails, CognitoUserSession } from 'amazon-cognito-identity-js';
import { UserPoolId, UserPoolClientId } from '@/utils/app';

// Types for the context
interface AuthContextType {
  isAuthenticated: boolean;
  userToken: string | null;
  userDetails: { [key: string]: any } | null; // Store user details as an object
  loginUser: (email: string, password: string) => Promise<void>;
  logoutUser: () => void;
  newPasswordRequired: boolean;
  completeNewPasswordChallenge: (newPassword: string) => Promise<void>;
}

// Cognito pool data
const poolData = {
  UserPoolId: UserPoolId!,
  ClientId: UserPoolClientId!,
};
const userPool = new CognitoUserPool(poolData);

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<{ [key: string]: any } | null>(null);
  const [cognitoUser, setCognitoUser] = useState<CognitoUser | null>(null);
  const [newPasswordRequired, setNewPasswordRequired] = useState(false);

  // Check current session
  useEffect(() => {
    const checkSession = () => {
      const user = userPool.getCurrentUser();
      if (user) {
        user.getSession((err: Error | null, session: CognitoUserSession | null) => {
          if (err) {
            console.error(err);
            return;
          }
          if (session && session.isValid()) {
            setIsAuthenticated(true);
            const token = session.getIdToken().getJwtToken();
            setUserToken(token);
            localStorage.setItem('sessionToken', token);
            // Fetch user details
            user.getUserAttributes((err, attributes) => {
              if (err) {
                console.error(err);
                setUserDetails(null); // Set to null on error
              } else if (attributes) {
                const details = attributes.reduce((acc, attribute) => {
                  acc[attribute.getName()] = attribute.getValue();
                  return acc;
                }, {} as { [key: string]: any });
                setUserDetails(details);
              } else {
                setUserDetails(null); // Set to null if no attributes are found
              }
            });
          } else {
            logoutUser(); // Clean up if session is invalid
          }
        });
      }
    };

    checkSession();
  }, []);

  // Handle user login
  const loginUser = async (email: string, password: string) => {
    const user = new CognitoUser({ Username: email, Pool: userPool });
    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    return new Promise<void>((resolve, reject) => {
      user.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          setIsAuthenticated(true);
          const token = result.getIdToken().getJwtToken();
          setUserToken(token);
          localStorage.setItem('sessionToken', token);
          // Fetch user details
          user.getUserAttributes((err, attributes) => {
            if (err) {
              console.error(err);
              setUserDetails(null); // Set to null on error
            } else if (attributes) {
              const details = attributes.reduce((acc, attribute) => {
                acc[attribute.getName()] = attribute.getValue();
                return acc;
              }, {} as { [key: string]: any });
              setUserDetails(details);
              resolve();
            } else {
              setUserDetails(null); // Set to null if no attributes are found
              resolve();
            }
          });
        },
        onFailure: (err) => {
          console.error(err);
          reject(err);
        },
        newPasswordRequired: (userAttributes, requiredAttributes) => {
          setCognitoUser(user);
          setNewPasswordRequired(true);
          reject(new Error('New password required'));
        },
      });
    });
  };

  const completeNewPasswordChallenge = async (newPassword: string) => {
    if (!cognitoUser) {
      throw new Error('No user in new password challenge');
    }

    return new Promise<void>((resolve, reject) => {
      cognitoUser.completeNewPasswordChallenge(newPassword, {}, {
        onSuccess: (result) => {
          setIsAuthenticated(true);
          const token = result.getIdToken().getJwtToken();
          setUserToken(token);
          localStorage.setItem('sessionToken', token);
          userPool.getCurrentUser()?.getUserAttributes((err, attributes) => {
            if (err) {
              console.error(err);
              setUserDetails(null);
            } else if (attributes) {
              const details = attributes.reduce((acc, attribute) => {
                acc[attribute.getName()] = attribute.getValue();
                return acc;
              }, {} as { [key: string]: any });
              setUserDetails(details);
              setNewPasswordRequired(false);
              setCognitoUser(null);
              resolve();
            } else {
              setUserDetails(null);
              setNewPasswordRequired(false);
              setCognitoUser(null);
              resolve();
            }
          });
        },
        onFailure: (err) => {
          console.error(err);
          reject(err);
        },
      });
    });
  };

  // Handle user logout
  const logoutUser = () => {
    const user = userPool.getCurrentUser();
    if (user) {
      user.signOut();
      setIsAuthenticated(false);
      setUserToken(null);
      setUserDetails(null);
      localStorage.removeItem('sessionToken');
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, userToken, userDetails, loginUser, logoutUser, newPasswordRequired, completeNewPasswordChallenge }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
