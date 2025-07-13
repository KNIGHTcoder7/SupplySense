import { useNavigate } from "react-router-dom";

const Logout = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">You have been logged out.</h2>
      <button
        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold transition"
        onClick={() => navigate("/")}
      >
        Return to Home
      </button>
    </div>
  );
};

export default Logout; 