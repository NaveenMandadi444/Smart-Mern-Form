import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { FileUp, BarChart3, Settings, LogOut } from "lucide-react";
import DocumentUploadModal from "../components/DocumentUploadModal";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [showUploadModal, setShowUploadModal] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">
              VisionForm Assist
            </h1>
            <p className="text-gray-600">Welcome, {user?.fullName}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Upload Card */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
            <FileUp className="w-12 h-12 text-blue-600 mb-4" />
            <h2 className="text-xl font-bold mb-2">Upload Documents</h2>
            <p className="text-gray-600 mb-4">
              Upload Aadhaar, PAN, Passport, and education certificates
            </p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
            >
              Upload Now
            </button>
          </div>

          {/* Vault Card */}
          <Link to="/vault">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
              <FileUp className="w-12 h-12 text-green-600 mb-4" />
              <h2 className="text-xl font-bold mb-2">Data Vault</h2>
              <p className="text-gray-600 mb-4">
                View and manage your stored documents and fields
              </p>
              <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">
                Open Vault
              </button>
            </div>
          </Link>

          {/* Form Assistant Card */}
          <Link to="/form-assist">
            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer">
              <BarChart3 className="w-12 h-12 text-purple-600 mb-4" />
              <h2 className="text-xl font-bold mb-2">Form Assistant</h2>
              <p className="text-gray-600 mb-4">
                Get intelligent suggestions when filling forms
              </p>
              <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700">
                Use Assistant
              </button>
            </div>
          </Link>
        </div>

        {/* Statistics */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold mb-4">Quick Stats</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">0</div>
              <div className="text-gray-600">Documents Uploaded</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">0</div>
              <div className="text-gray-600">Fields Extracted</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">0</div>
              <div className="text-gray-600">Autofills Used</div>
            </div>
          </div>
        </div>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <DocumentUploadModal onClose={() => setShowUploadModal(false)} />
      )}
    </div>
  );
}
