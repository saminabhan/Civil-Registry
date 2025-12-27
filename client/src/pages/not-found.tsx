import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50" dir="rtl">
      <div className="p-8 bg-white rounded-2xl shadow-xl text-center max-w-md border border-gray-100">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">الصفحة غير موجودة</h1>
        <p className="text-gray-500 mb-8">
          عذراً، الصفحة التي تحاول الوصول إليها غير موجودة أو تم نقلها.
        </p>
        <Link href="/" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
