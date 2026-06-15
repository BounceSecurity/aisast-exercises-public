import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";

interface UserData {
  id: number;
  username: string;
  role: string;
  email: string;
  mfa_enabled: number;
  balance: number;
  display_name: string | null;
  profile_image: string | null;
}

interface UserContextValue {
  user: UserData | null;
  loading: boolean;
  refresh: () => void;
}

const UserContext = createContext<UserContextValue>({
  user: null,
  loading: true,
  refresh: () => {},
});

function fetchUser(
  setUser: (u: UserData | null) => void,
  setLoading: (l: boolean) => void
) {
  setLoading(true);
  fetch("/api/auth/me")
    .then((res) => {
      if (!res.ok) {
        setUser(null);
        return null;
      }
      return res.json();
    })
    .then((data) => {
      if (data) setUser(data);
      setLoading(false);
    })
    .catch(() => {
      setUser(null);
      setLoading(false);
    });
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(setUser, setLoading);
  }, []);

  const refresh = useCallback(() => {
    fetchUser(setUser, setLoading);
  }, []);

  return (
    <UserContext.Provider value={{ user, loading, refresh }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
