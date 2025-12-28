import { useState } from "react";
import { useLogs } from "@/hooks/use-logs";
import { Loader2, User, ArrowLeft } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { useLocation } from "wouter";

export default function AllLogs() {
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading } = useLogs(currentPage);
  const [, setLocation] = useLocation();
  
  const logs = data?.data || [];
  const pagination = data ? {
    currentPage: data.currentPage || 1,
    lastPage: data.lastPage || 1,
    total: data.total || 0,
  } : null;

  return (
    <div className="space-y-8" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => setLocation("/logs")}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة إلى السجلات</span>
          </button>
          <h1 className="text-3xl font-bold text-foreground">جميع السجلات</h1>
          <p className="text-muted-foreground mt-2">عرض جميع سجلات النشاط في النظام</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-muted/30 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold text-sm text-foreground">المستخدم</th>
                <th className="px-6 py-4 font-semibold text-sm text-foreground">الإجراء</th>
                <th className="px-6 py-4 font-semibold text-sm text-foreground">التفاصيل</th>
                <th className="px-6 py-4 font-semibold text-sm text-foreground">التوقيت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs?.map((log: any) => (
                <tr key={log.id} className="hover:bg-muted/10 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <User className="w-4 h-4 text-muted-foreground" />
                      {log.username || "مستخدم محذوف"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                      log.action === 'LOGIN' ? 'bg-green-100 text-green-700' :
                      log.action === 'LOGOUT' ? 'bg-red-100 text-red-700' :
                      log.action === 'SEARCH' ? 'bg-blue-100 text-blue-700' :
                      log.action === 'NAVIGATE' ? 'bg-gray-100 text-gray-700' :
                      log.action === 'CREATE_USER' ? 'bg-purple-100 text-purple-700' :
                      log.action === 'UPDATE_USER_STATUS' ? 'bg-orange-100 text-orange-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground max-w-md">
                    <div className="truncate" title={log.details || ""}>
                      {log.details || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap font-mono text-xs">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString('ar-SA') : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pagination && pagination.lastPage > 1 && (
            <Pagination
              currentPage={pagination.currentPage}
              lastPage={pagination.lastPage}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}
    </div>
  );
}


