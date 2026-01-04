import { useState, useEffect } from "react";
import { useSearchCitizens, useCreateCitizen } from "@/hooks/use-citizens";
import { useAuth } from "@/hooks/use-auth";
import { Search, Loader2, UserPlus, Info, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'name' | 'id'>('name');
  const [searchParams, setSearchParams] = useState<any>({});
  const [triggerSearch, setTriggerSearch] = useState(false);
  const { toast } = useToast();
  
  const { data: searchResult, isLoading, error } = useSearchCitizens(triggerSearch ? searchParams : null);
  const results = searchResult?.citizens || [];
  const resultCount = searchResult?.count || 0;
  const resultMessage = searchResult?.message || "";
  
  // Show error toast if there's an error
  useEffect(() => {
    if (error && triggerSearch) {
      toast({
        variant: "destructive",
        title: "خطأ في البحث",
        description: error instanceof Error ? error.message : "حدث خطأ أثناء البحث",
      });
    }
  }, [error, triggerSearch, toast]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const params: any = {};
    
    if (activeTab === 'name') {
      const firstName = formData.get('firstName')?.toString().trim();
      const lastName = formData.get('lastName')?.toString().trim();
      
      // Validate that firstName and lastName are provided
      if (!firstName || !lastName) {
        toast({
          variant: "destructive",
          title: "خطأ في الإدخال",
          description: "الرجاء إدخال الاسم الأول واسم العائلة على الأقل",
        });
        return;
      }
      
      params.firstName = firstName;
      params.lastName = lastName;
      params.fatherName = formData.get('fatherName')?.toString().trim();
      params.grandfatherName = formData.get('grandfatherName')?.toString().trim();
    } else {
      const nationalId = formData.get('nationalId')?.toString().trim();
      if (!nationalId) {
        toast({
          variant: "destructive",
          title: "خطأ في الإدخال",
          description: "الرجاء إدخال رقم الهوية",
        });
        return;
      }
      params.nationalId = nationalId;
    }

    setSearchParams(params);
    setTriggerSearch(true);
  };

  return (
    <div className="space-y-8" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">بحث المواطنين</h1>
        <p className="text-muted-foreground mt-2">ابحث في قاعدة البيانات باستخدام الاسم أو رقم الهوية</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="flex border-b border-border">
          <button
            onClick={() => { setActiveTab('name'); setTriggerSearch(false); }}
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              activeTab === 'name' 
                ? 'bg-primary/5 text-primary border-b-2 border-primary' 
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            بحث بالاسم
          </button>
          <button
            onClick={() => { setActiveTab('id'); setTriggerSearch(false); }}
            className={`flex-1 py-4 text-center font-medium transition-colors ${
              activeTab === 'id' 
                ? 'bg-primary/5 text-primary border-b-2 border-primary' 
                : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            بحث برقم الهوية
          </button>
        </div>

        <div className="p-8 bg-muted/10">
          <form onSubmit={handleSearch} className="space-y-6">
            <AnimatePresence mode="wait">
              {activeTab === 'name' ? (
                <motion.div
                  key="name-search"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4"
                >
                  <InputGroup label="الاسم الأول" name="firstName" />
                  <InputGroup label="اسم الأب" name="fatherName" />
                  <InputGroup label="اسم الجد" name="grandfatherName" />
                  <InputGroup label="اسم العائلة" name="lastName" />
                </motion.div>
              ) : (
                <motion.div
                  key="id-search"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-md mx-auto"
                >
                  <InputGroup label="رقم الهوية الوطنية" name="nationalId" />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                <span>بحث في السجل</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
            <p>جاري البحث...</p>
          </div>
        ) : error ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-destructive/10 border-2 border-destructive/30 rounded-2xl p-8"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">حدث خطأ أثناء البحث</h3>
              <p className="text-muted-foreground text-sm max-w-md">
                {error instanceof Error ? error.message : "حدث خطأ غير متوقع أثناء البحث. يرجى المحاولة مرة أخرى."}
              </p>
            </div>
          </motion.div>
        ) : triggerSearch && results.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
            <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground">لا توجد نتائج</h3>
            <p className="text-muted-foreground">{resultMessage || "لم يتم العثور على سجلات مطابقة لمعايير البحث"}</p>
          </div>
        ) : triggerSearch && results.length > 0 ? (
          <>
            <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                {resultMessage || `تم العثور على ${resultCount} مواطن`}
              </p>
              <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                {resultCount} نتيجة
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {results.map((citizen: any) => (
                <motion.div
                  key={citizen.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Main Info - Left Column */}
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl border border-primary/20 flex-shrink-0">
                        {citizen.firstName?.charAt(0) || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-bold text-foreground mb-2 leading-tight">
                          {citizen.fullName || `${citizen.firstName} ${citizen.fatherName} ${citizen.grandfatherName} ${citizen.lastName}`}
                        </h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-medium bg-muted px-2.5 py-1 rounded-full text-foreground">
                            {citizen.nationalId}
                          </span>
                          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                            {citizen.genderText || (citizen.gender === 'male' ? 'ذكر' : 'أنثى')}
                          </span>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            citizen.isDead 
                              ? 'bg-red-100 text-red-700' 
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {citizen.deathStatus || (citizen.isDead ? 'متوفي' : 'حي')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Middle Column - Personal Info */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        {citizen.age !== undefined && citizen.age !== null && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {citizen.isDead ? 'العمر عند الوفاة' : 'العمر'}
                            </p>
                            <p className="font-medium text-sm">{citizen.age} سنة</p>
                          </div>
                        )}
                        {citizen.dobText && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">تاريخ الميلاد</p>
                            <p className="font-medium text-sm">{citizen.dobText}</p>
                          </div>
                        )}
                        {citizen.isDead && citizen.deathDateText && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">تاريخ الوفاة</p>
                            <p className="font-medium text-sm text-red-600">{citizen.deathDateText}</p>
                          </div>
                        )}
                        {citizen.socialStatus && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">الحالة الاجتماعية</p>
                            <p className="font-medium text-sm">{citizen.socialStatus}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Right Column - Location Info */}
                    <div className="space-y-2">
                      {citizen.region && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">المنطقة</p>
                          <p className="font-medium text-sm">{citizen.region}</p>
                        </div>
                      )}
                      {citizen.city && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">المدينة</p>
                          <p className="font-medium text-sm">{citizen.city}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

function InputGroup({ label, name }: { label: string; name: string }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-foreground">{label}</label>
      <input
        name={name}
        className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
        placeholder={`أدخل ${label}`}
      />
    </div>
  );
}
