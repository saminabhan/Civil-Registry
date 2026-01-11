import { Link } from "wouter";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900" dir="rtl">
      <div className="p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl text-center max-w-md border border-gray-100 dark:border-slate-700">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">الصفحة غير موجودة</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          عذراً، الصفحة التي تحاول الوصول إليها غير موجودة أو تم نقلها.
        </p>
        <Link href="/" className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors">
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
