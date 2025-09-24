import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useMemo, useEffect, useState } from "react";
import { LogOut, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";  // Axios instance

const ROLE_KEY = "bvp.admin.role"; // 'super' | 'sub'

interface ToggleResponse {
  isActive: boolean;
  message: string;
}

const AdminLayout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const role = useMemo(() => (localStorage.getItem(ROLE_KEY) || "sub").toLowerCase(), []);
  const adminEmail = localStorage.getItem("bvp.admin.email");

  const [toggleState, setToggleState] = useState<ToggleResponse>({
    isActive: false,
    message: "Normal Day",
  });
  const [loading, setLoading] = useState(true);

  // Fetch the current toggle state from backend
  const fetchToggle = async () => {
    try {
      setLoading(true);
      const res = await api.get<ToggleResponse>("/content/toggle");
      setToggleState(res.data);
    } catch (err) {
      console.error("Failed to fetch toggle:", err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle the day
  const toggleDay = async () => {
    try {
      // Send updated toggle state
      await api.put("/content/toggle", { isActive: !toggleState.isActive });

      // Re-fetch latest toggle state to ensure it's updated correctly
      fetchToggle();
    } catch (err) {
      console.error("Toggle failed:", err);
      toast({
        title: "Error",
        description: "Failed to toggle day. Try again.",
        duration: 3000,
      });
    }
  };

  // Logout function
  const handleLogout = async () => {
    try {
      await api.get("/logout"); // clear cookie from backend

      // Clear localStorage
      localStorage.removeItem("bvp.admin.loggedIn");
      localStorage.removeItem("bvp.admin.email");
      localStorage.removeItem("bvp.admin.role");

      toast({
        title: "Logged Out",
        description: "You have been successfully logged out.",
        duration: 3000,
      });

      navigate("/admin/login");
    } catch (err) {
      console.error("Logout failed:", err);
      toast({
        title: "Error",
        description: "Failed to log out. Try again.",
        duration: 3000,
      });
    }
  };

  useEffect(() => {
    fetchToggle();
  }, []);

  return (
    <div className="min-h-screen w-full grid grid-cols-[220px_1fr] bg-muted/20">
      {/* Sidebar */}
      <aside className="border-r bg-white relative">
        <div className="h-14 px-4 flex items-center font-semibold">Admin</div>
        <Separator />
        <nav className="p-2 space-y-1 pb-24">
          <NavLink
            to="/admin/banner"
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm ${isActive ? "bg-muted font-medium" : "hover:bg-muted"}`
            }
          >
            Update Banner
          </NavLink>

          <NavLink
            to="/admin/news"
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm ${isActive ? "bg-muted font-medium" : "hover:bg-muted"}`
            }
          >
            News Manager
          </NavLink>

          <NavLink
            to="/admin/photo-gallery"
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm ${isActive ? "bg-muted font-medium" : "hover:bg-muted"}`
            }
          >
            Photo Gallery
          </NavLink>

          <NavLink
            to="/admin/sub-admins"
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm ${isActive ? "bg-muted font-medium" : "hover:bg-muted"}`
            }
          >
            Sub Admins
          </NavLink>

          {role === "super" && (
            <NavLink
              to="/admin/super-email"
              className={({ isActive }) =>
                `block px-3 py-2 rounded-md text-sm ${isActive ? "bg-muted font-medium" : "hover:bg-muted"}`
              }
            >
              Super Admin Email
            </NavLink>
          )}
        </nav>

        {/* User Info and Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center space-x-2 mb-3">
            <User className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground truncate">{adminEmail}</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="p-4">
        <div className="flex flex-col items-center justify-center mt-10 space-y-4">
          <h1 className="text-2xl font-semibold text-gray-700">
            {loading ? "Loading..." : toggleState.message}
          </h1>
          <Button
            onClick={toggleDay}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md transition-all duration-200"
          >
            Toggle Day
          </Button>
        </div>

        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
