import { useState, useEffect } from "react";
import { useSearchCitizens, useCreateCitizen } from "@/hooks/use-citizens";
import { usePhoneAPI, type PhoneApiData } from "@/hooks/use-phone-api";
import { Search, Loader2, Info, AlertCircle, Phone } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [registryYear, setRegistryYear] = useState<2019 | 2023>(2019);
  const [searchParams, setSearchParams] = useState<any>({});
  const [triggerSearch, setTriggerSearch] = useState(false);
  const [searchByNationalId, setSearchByNationalId] = useState(false);
  const [currentSearchNationalId, setCurrentSearchNationalId] = useState<string | null>(null);
  const [phoneData, setPhoneData] = useState<Record<string, PhoneApiData>>({});
  const [loadingPhones, setLoadingPhones] = useState<Record<string, boolean>>({});
  const { toast } = useToast();
  const { fetchPhoneData, isLoading: isPhoneAPILoading } = usePhoneAPI();
  
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

  // Clear phone data when registry year changes
  useEffect(() => {
    setPhoneData({});
    setLoadingPhones({});
    setCurrentSearchNationalId(null);
    setTriggerSearch(false);
  }, [registryYear]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const params: any = {};
    
    const nationalId = formData.get('nationalId')?.toString().trim();
    const firstName = formData.get('firstName')?.toString().trim();
    const lastName = formData.get('lastName')?.toString().trim();
    
    // Reset phone data for new search
    setPhoneData({});
    setLoadingPhones({});
    setCurrentSearchNationalId(null);
    
    // If national ID is provided, search by ID only
    if (nationalId) {
      params.nationalId = nationalId;
      setSearchByNationalId(true);
      setCurrentSearchNationalId(nationalId);
    } else {
      // Otherwise, search by name
      if (!firstName || !lastName) {
        toast({
          variant: "destructive",
          title: "خطأ في الإدخال",
          description: "الرجاء إدخال رقم الهوية أو الاسم الأول واسم العائلة على الأقل",
        });
        return;
      }
      
      params.firstName = firstName;
      params.lastName = lastName;
      params.fatherName = formData.get('fatherName')?.toString().trim();
      params.grandfatherName = formData.get('grandfatherName')?.toString().trim();
      setSearchByNationalId(false);
    }

    // Add registry year to params
    params.registryYear = registryYear;
    
    setSearchParams(params);
    setTriggerSearch(true);
  };

  const handleFetchPhoneData = async (nationalId: string) => {
    // Don't fetch if already loading
    if (loadingPhones[nationalId]) return;
    
    setLoadingPhones(prev => ({ ...prev, [nationalId]: true }));
    
    try {
      const data = await fetchPhoneData(nationalId);
      setPhoneData(prev => ({ ...prev, [nationalId]: data }));
    } finally {
      setLoadingPhones(prev => ({ ...prev, [nationalId]: false }));
    }
  };

  // Fetch phone number automatically when searching by national ID
  // Always fetch for new search to ensure fresh data
  useEffect(() => {
    if (triggerSearch && searchByNationalId && results.length > 0 && currentSearchNationalId) {
      const citizen = results[0];
      // Always fetch phone data for the current search
      if (citizen.nationalId === currentSearchNationalId) {
        // Clear existing data to force fresh fetch
        setPhoneData(prev => {
          const { [citizen.nationalId]: _, ...rest } = prev;
          return rest;
        });
        setLoadingPhones(prev => {
          const { [citizen.nationalId]: _, ...rest } = prev;
          return rest;
        });
        
        // Small delay to ensure state is cleared, then fetch
        const timeoutId = setTimeout(() => {
          handleFetchPhoneData(citizen.nationalId);
        }, 100);
        
        return () => clearTimeout(timeoutId);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerSearch, currentSearchNationalId, results.length]);

  return (
    <div className="space-y-8" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">بحث المواطنين</h1>
        <p className="text-muted-foreground mt-2">ابحث في قاعدة البيانات باستخدام الاسم أو رقم الهوية</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="p-8 bg-muted/10">
          <form onSubmit={handleSearch} className="space-y-6">
            {/* Registry Year Selection */}
            <div className="flex items-center gap-4 pb-4 border-b border-border/50">
              <label className="text-sm font-medium text-foreground whitespace-nowrap">السجل:</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRegistryYear(2019)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    registryYear === 2019
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  2019
                </button>
                <button
                  type="button"
                  onClick={() => setRegistryYear(2023)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    registryYear === 2023
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  2023
                </button>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* رقم الهوية في الأعلى */}
              <div className="max-w-md">
                <InputGroup label="رقم الهوية الوطنية" name="nationalId" />
              </div>
              
              {/* حقول الأسماء */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <InputGroup label="الاسم الأول" name="firstName" />
                <InputGroup label="اسم الأب" name="fatherName" />
                <InputGroup label="اسم الجد" name="grandfatherName" />
                <InputGroup label="اسم العائلة" name="lastName" />
              </div>
            </div>

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
                          {/* Only show death status for 2019 registry */}
                          {citizen.registryYear === 2019 && (
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              citizen.isDead 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-green-100 text-green-700'
                            }`}>
                              {citizen.deathStatus || (citizen.isDead ? 'متوفي' : 'حي')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Middle Column - Personal Info */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-3">
                        {citizen.age !== undefined && citizen.age !== null && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {citizen.registryYear === 2019 && citizen.isDead ? 'العمر عند الوفاة' : 'العمر'}
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
                        {/* Phone Number in same row as Date of Birth */}
                        {phoneData[citizen.nationalId]?.mobile && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">رقم الهاتف</p>
                            <p className="font-medium text-sm text-primary">{phoneData[citizen.nationalId].mobile}</p>
                          </div>
                        )}
                        {/* Only show death date for 2019 registry */}
                        {citizen.registryYear === 2019 && citizen.isDead && citizen.deathDateText && (
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
                      
                      {/* Detailed Address Section */}
                      <div className="pt-2 border-t border-border/50">
                        {phoneData[citizen.nationalId] !== undefined ? (
                          <>
                            {phoneData[citizen.nationalId].governorate || 
                             phoneData[citizen.nationalId].city || 
                             phoneData[citizen.nationalId].area ? (
                              <div>
                                <p className="text-xs text-muted-foreground mb-1">العنوان بالتفصيل</p>
                                <p className="font-medium text-sm leading-relaxed">
                                  {[
                                    phoneData[citizen.nationalId].governorate,
                                    phoneData[citizen.nationalId].city,
                                    phoneData[citizen.nationalId].area
                                  ].filter(Boolean).join(' - ')}
                                </p>
                              </div>
                            ) : (
                              <div>
                                <p className="text-xs text-muted-foreground">البيانات غير متوفرة</p>
                              </div>
                            )}
                          </>
                        ) : (
                          !searchByNationalId && (
                            <button
                              onClick={() => handleFetchPhoneData(citizen.nationalId)}
                              disabled={loadingPhones[citizen.nationalId] || isPhoneAPILoading}
                              className="w-full flex flex-col items-center justify-center gap-1.5 px-4 py-3 text-xs font-medium text-primary bg-gradient-to-br from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10 border border-primary/20 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                            >
                              {loadingPhones[citizen.nationalId] || isPhoneAPILoading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  <span>جاري الجلب...</span>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4" />
                                    <span className="font-semibold">جلب رقم الهاتف والموقع</span>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">اضغط لعرض التفاصيل</span>
                                </>
                              )}
                            </button>
                          )
                        )}
                        {searchByNationalId && loadingPhones[citizen.nationalId] && (
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>جاري جلب البيانات...</span>
                          </div>
                        )}
                      </div>
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
