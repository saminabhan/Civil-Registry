import { useState } from "react";
import { useUsersWithLogCounts, useUserRecentSearches } from "@/hooks/use-logs";
import { Loader2, User, Shield, Activity, List, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation } from "wouter";

export default function Logs() {
  const { data: users, isLoading } = useUsersWithLogCounts();
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [searchUserId, setSearchUserId] = useState<number | null>(null);
  const [, setLocation] = useLocation();

  const handleViewAllLogs = (userId: number) => {
    setLocation(`/logs/user/${userId}`);
  };

  const handleViewRecentSearches = (userId: number) => {
    setSearchUserId(userId);
    setIsSearchDialogOpen(true);
  };

  const handleCloseSearchDialog = () => {
    setIsSearchDialogOpen(false);
    setSearchUserId(null);
  };

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
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-border dark:border-slate-700 shadow-sm overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-muted/30 dark:bg-slate-700/30 border-b border-border dark:border-slate-700">
              <tr>
                <th className="px-6 py-4 font-semibold text-sm text-foreground">المستخدم</th>
                <th className="px-6 py-4 font-semibold text-sm text-foreground">الصلاحية</th>
                <th className="px-6 py-4 font-semibold text-sm text-foreground">عدد السجلات</th>
                <th className="px-6 py-4 font-semibold text-sm text-foreground">الحالة</th>
                <th className="px-6 py-4 font-semibold text-sm text-foreground">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-slate-700">
              {users?.map((user: any) => (
                <tr key={user.id} className="hover:bg-muted/10 dark:hover:bg-slate-700/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {user.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-xs text-muted-foreground">{user.name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.isAdmin ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        <Shield className="w-3 h-3" />
                        مسؤول
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                        <User className="w-3 h-3" />
                        مستخدم
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold">{user.logsCount || 0}</span>
                      <span className="text-sm text-muted-foreground">سجل</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      user.isActive 
                        ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300" 
                        : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? "bg-green-500" : "bg-red-500"}`} />
                      {user.isActive ? "نشط" : "معطل"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleViewAllLogs(user.id)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
                      >
                        <List className="w-4 h-4" />
                        <span>عرض الكل</span>
                      </button>
                      <button
                        onClick={() => handleViewRecentSearches(user.id)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 transition-colors text-sm font-medium"
                      >
                        <Search className="w-4 h-4" />
                        <span>آخر 10 بحث</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {searchUserId && (
        <UserRecentSearchesDialog
          userId={searchUserId}
          open={isSearchDialogOpen}
          onOpenChange={handleCloseSearchDialog}
        />
      )}
    </div>
  );
}

function UserRecentSearchesDialog({ 
  userId,
  open, 
  onOpenChange 
}: { 
  userId: number;
  open: boolean; 
  onOpenChange: (open: boolean) => void;
}) {
  const { data: searches, isLoading } = useUserRecentSearches(userId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-right flex items-center gap-2">
            <Search className="w-5 h-5" />
            آخر 10 عمليات بحث
          </DialogTitle>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="mt-4">
            {searches && searches.length > 0 ? (
              <div className="relative">
                {/* Timeline - centered vertical line */}
                <div className="absolute right-1/2 top-0 bottom-0 w-0.5 bg-border transform translate-x-1/2" />
                
                <div className="space-y-6">
                  {searches.map((search: any, index: number) => {
                    // Parse search details
                    let searchDetails = search.details || "";
                    let parsedData = null;
                    
                    if (searchDetails.includes("Searched citizens:")) {
                      try {
                        const jsonStr = searchDetails.replace("Searched citizens:", "").trim();
                        parsedData = JSON.parse(jsonStr);
                      } catch (e) {
                        // If parsing fails, show original
                      }
                    }

                    // Alternate between right and left (RTL: even = right, odd = left)
                    const isRight = index % 2 === 0;

                    return (
                      <div key={search.id} className="relative flex items-start">
                        {/* Timeline dot - centered */}
                        <div className="absolute right-1/2 top-2 w-3 h-3 rounded-full bg-primary border-2 border-background z-10 transform translate-x-1/2" />
                        
                        {/* Content - alternating sides */}
                        <div className={`flex-1 ${isRight ? 'pr-8' : 'pl-8'}`} style={isRight ? { marginRight: 'calc(50% + 0.5rem)' } : { marginLeft: 'calc(50% + 0.5rem)' }}>
                          <div className="bg-card dark:bg-slate-800 border border-border dark:border-slate-700 rounded-lg p-4 hover:bg-muted/10 dark:hover:bg-slate-700/10 transition-colors" dir="rtl">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <Search className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-semibold text-blue-600">عملية بحث</span>
                              </div>
                              <span className="text-xs text-muted-foreground font-mono">
                                {search.createdAt ? new Date(search.createdAt).toLocaleString('ar-SA') : '-'}
                              </span>
                            </div>
                            
                            {parsedData ? (
                              <div className="bg-muted/50 dark:bg-slate-700/50 rounded-lg p-3 space-y-2">
                                {parsedData.nationalId && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground min-w-[100px]">الرقم الوطني:</span>
                                    <span className="text-sm font-semibold">{parsedData.nationalId}</span>
                                  </div>
                                )}
                                {parsedData.firstName && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground min-w-[100px]">الاسم الأول:</span>
                                    <span className="text-sm font-semibold">{parsedData.firstName}</span>
                                  </div>
                                )}
                                {parsedData.fatherName && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground min-w-[100px]">اسم الأب:</span>
                                    <span className="text-sm font-semibold">{parsedData.fatherName}</span>
                                  </div>
                                )}
                                {parsedData.grandfatherName && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground min-w-[100px]">اسم الجد:</span>
                                    <span className="text-sm font-semibold">{parsedData.grandfatherName}</span>
                                  </div>
                                )}
                                {parsedData.lastName && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-medium text-muted-foreground min-w-[100px]">اسم العائلة:</span>
                                    <span className="text-sm font-semibold">{parsedData.lastName}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-foreground">{searchDetails}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                لا توجد عمليات بحث
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
