import { useLogs } from "@/hooks/use-logs";
import { Loader2, Activity, Clock, User, ArrowRight } from "lucide-react";

export default function Logs() {
  const { data: logs, isLoading } = useLogs();

  return (
    <div className="space-y-8" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">سجلات النشاط</h1>
        <p className="text-muted-foreground mt-2">تتبع حركات المستخدمين وعمليات النظام</p>
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
              {logs?.map((log) => (
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
                      log.action === 'SEARCH' ? 'bg-blue-100 text-blue-700' :
                      log.action === 'NAVIGATE' ? 'bg-gray-100 text-gray-700' :
                      'bg-purple-100 text-purple-700'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground max-w-md truncate" title={log.details || ""}>
                    {log.details || "-"}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap font-mono text-xs">
                    {new Date(log.timestamp!).toLocaleString('ar-SA')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
