import { useState } from "react";
import { useSearchCitizens, useCreateCitizen } from "@/hooks/use-citizens";
import { useAuth } from "@/hooks/use-auth";
import { useCreateLog } from "@/hooks/use-logs";
import { Search, Loader2, UserPlus, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'name' | 'id'>('name');
  const [searchParams, setSearchParams] = useState<any>({});
  const [triggerSearch, setTriggerSearch] = useState(false);
  
  const { data: results, isLoading } = useSearchCitizens(triggerSearch ? searchParams : null);
  const { mutate: logAction } = useCreateLog();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const params: any = {};
    
    if (activeTab === 'name') {
      params.firstName = formData.get('firstName');
      params.fatherName = formData.get('fatherName');
      params.grandfatherName = formData.get('grandfatherName');
      params.lastName = formData.get('lastName');
    } else {
      params.nationalId = formData.get('nationalId');
    }

    setSearchParams(params);
    setTriggerSearch(true);
    
    // Log the search
    logAction({ 
      action: 'SEARCH', 
      details: `Search by ${activeTab}: ${JSON.stringify(params)}` 
    });
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
        ) : triggerSearch && results?.length === 0 ? (
          <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed border-border">
            <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground">لا توجد نتائج</h3>
            <p className="text-muted-foreground">لم يتم العثور على سجلات مطابقة لمعايير البحث</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {results?.map((citizen) => (
              <motion.div
                key={citizen.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-xl border border-border shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl border border-primary/20">
                    {citizen.firstName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      {citizen.firstName} {citizen.fatherName} {citizen.grandfatherName} {citizen.lastName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-medium bg-muted px-2 py-0.5 rounded text-muted-foreground">
                        {citizen.nationalId}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {citizen.gender === 'male' ? 'ذكر' : 'أنثى'} • {new Date(citizen.dob!).toLocaleDateString('ar-SA')}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="pl-4 border-l border-border/50 text-left">
                  <p className="text-sm text-muted-foreground">العنوان</p>
                  <p className="font-medium">{citizen.address}</p>
                  <p className="text-sm text-muted-foreground mt-2">اسم الأم</p>
                  <p className="font-medium">{citizen.motherName}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
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
