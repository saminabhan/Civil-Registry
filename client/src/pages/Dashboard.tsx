import { useState, useEffect } from "react";
import { useSearchCitizens, useCreateCitizen } from "@/hooks/use-citizens";
import { usePhoneAPI, type PhoneApiData } from "@/hooks/use-phone-api";
import { Search, Loader2, Info, AlertCircle, Phone, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [registryYear, setRegistryYear] = useState<2019 | 2023>(2019);
  const [searchParams, setSearchParams] = useState<any>({});
  const [triggerSearch, setTriggerSearch] = useState(false);
  const [searchCounter, setSearchCounter] = useState(0); // Counter to force re-fetch
  const [searchByNationalId, setSearchByNationalId] = useState(false);
  const [currentSearchNationalId, setCurrentSearchNationalId] = useState<string | null>(null);
  const [phoneData, setPhoneData] = useState<Record<string, PhoneApiData>>({});
  const [loadingPhones, setLoadingPhones] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
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
    // Increment search counter to force re-fetch of phone data
    setSearchCounter(prev => prev + 1);
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

  const handleCopy = async (text: string, citizenId: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(citizenId);
      setCopiedField(field);
      
      // تحديد نوع البيانات المنسوخة
      const fieldNames: Record<string, string> = {
        'fullName': 'الاسم الكامل',
        'firstName': 'الاسم الأول',
        'fatherName': 'اسم الأب',
        'grandfatherName': 'اسم الجد',
        'lastName': 'اسم العائلة',
        'nationalId': 'الرقم الوطني',
        'phone': 'رقم الهاتف',
      };
      
      const fieldName = fieldNames[field] || 'النص';
      
      toast({
        title: "تم النسخ بنجاح",
        description: `تم نسخ ${fieldName} بنجاح`,
        className: "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 shadow-lg",
        duration: 3000,
      });
      
      // Reset copied state after 2.5 seconds with fade out
      setTimeout(() => {
        setCopiedId(null);
        setCopiedField(null);
      }, 2500);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "خطأ في النسخ",
        description: "فشل نسخ النص إلى الحافظة",
        className: "border-destructive/50 shadow-lg",
        duration: 3000,
      });
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
  }, [triggerSearch, currentSearchNationalId, results.length, searchCounter]);

  return (
    <div className="space-y-8" dir="rtl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">بحث المواطنين</h1>
        <p className="text-muted-foreground mt-2">ابحث في قاعدة البيانات باستخدام الاسم أو رقم الهوية</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-border dark:border-slate-700 overflow-hidden">
        <div className="p-8 bg-muted/10 dark:bg-slate-700/10">
          <form onSubmit={handleSearch} className="space-y-6">
            {/* Registry Year Selection */}
              <div className="flex items-center gap-4 pb-4 border-b border-border/50 dark:border-slate-700/50">
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
          <div className="text-center py-20 bg-muted/30 dark:bg-slate-800/30 rounded-2xl border border-dashed border-border dark:border-slate-700">
            <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-bold text-foreground">لا توجد نتائج</h3>
            <p className="text-muted-foreground">{resultMessage || "لم يتم العثور على سجلات مطابقة لمعايير البحث"}</p>
          </div>
        ) : triggerSearch && results.length > 0 ? (
          <>
            <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 rounded-xl px-4 py-3 flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">
                {resultMessage || `تم العثور على ${resultCount} مواطن`}
              </p>
              <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                {resultCount} نتيجة
              </span>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {results.map((citizen: any) => {
                const fullName = citizen.fullName || `${citizen.firstName} ${citizen.fatherName} ${citizen.grandfatherName} ${citizen.lastName}`;
                const isCopied = copiedId === citizen.nationalId && copiedField !== null;
                
                return (
                <motion.div
                  key={citizen.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white dark:bg-slate-800 p-6 rounded-xl border relative overflow-hidden transition-all duration-500 ${
                    isCopied 
                      ? 'border-primary shadow-2xl shadow-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-white dark:from-primary/15 dark:via-primary/10 dark:to-slate-800' 
                      : 'border-border dark:border-slate-700 shadow-sm hover:shadow-md'
                  }`}
                >
                  {/* Animated background effect when copied */}
                  {isCopied && (
                    <motion.div
                      key={`bg-effect-${copiedField}`}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ 
                        scale: [0, 1.3, 1],
                        opacity: [0, 0.9, 0.7, 0]
                      }}
                      transition={{ 
                        duration: 2.5,
                        times: [0, 0.2, 0.6, 1],
                        ease: "easeInOut"
                      }}
                      className="absolute inset-0 bg-gradient-to-r from-primary/15 via-primary/20 to-primary/15 pointer-events-none"
                    />
                  )}
                  
                  {/* Ripple effect */}
                  {isCopied && (
                    <motion.div
                      key={`ripple-${copiedField}`}
                      initial={{ scale: 0, opacity: 0.8 }}
                      animate={{ 
                        scale: [0, 2, 2.5],
                        opacity: [0.8, 0.4, 0]
                      }}
                      transition={{ 
                        duration: 1.5,
                        ease: "easeOut"
                      }}
                      className="absolute inset-0 border-2 border-primary/30 rounded-xl pointer-events-none"
                    />
                  )}
                  
                  {/* Sparkle effects */}
                  {isCopied && (
                    <>
                      <motion.div
                        key={`sparkle-1-${copiedField}`}
                        initial={{ scale: 0, rotate: 0, opacity: 0, x: 0, y: 0 }}
                        animate={{ 
                          scale: [0, 1.8, 0],
                          rotate: [0, 360],
                          opacity: [0, 1, 0],
                          x: [0, 20, 0],
                          y: [0, -15, 0]
                        }}
                        transition={{ 
                          duration: 1.8,
                          times: [0, 0.5, 1],
                          delay: 0.1,
                          ease: "easeOut"
                        }}
                        className="absolute top-4 left-4 w-3 h-3 bg-primary rounded-full shadow-xl shadow-primary/60"
                      />
                      <motion.div
                        key={`sparkle-2-${copiedField}`}
                        initial={{ scale: 0, rotate: 0, opacity: 0, x: 0, y: 0 }}
                        animate={{ 
                          scale: [0, 1.8, 0],
                          rotate: [0, -360],
                          opacity: [0, 1, 0],
                          x: [0, -25, 0],
                          y: [0, 20, 0]
                        }}
                        transition={{ 
                          duration: 1.8,
                          times: [0, 0.5, 1],
                          delay: 0.3,
                          ease: "easeOut"
                        }}
                        className="absolute top-6 right-8 w-2.5 h-2.5 bg-primary rounded-full shadow-xl shadow-primary/60"
                      />
                      <motion.div
                        key={`sparkle-3-${copiedField}`}
                        initial={{ scale: 0, rotate: 0, opacity: 0, x: 0, y: 0 }}
                        animate={{ 
                          scale: [0, 1.8, 0],
                          rotate: [0, 360],
                          opacity: [0, 1, 0],
                          x: [0, 15, 0],
                          y: [0, 25, 0]
                        }}
                        transition={{ 
                          duration: 1.8,
                          times: [0, 0.5, 1],
                          delay: 0.5,
                          ease: "easeOut"
                        }}
                        className="absolute bottom-4 right-4 w-3 h-3 bg-primary rounded-full shadow-xl shadow-primary/60"
                      />
                      <motion.div
                        key={`sparkle-4-${copiedField}`}
                        initial={{ scale: 0, rotate: 0, opacity: 0, x: 0, y: 0 }}
                        animate={{ 
                          scale: [0, 1.5, 0],
                          rotate: [0, -360],
                          opacity: [0, 1, 0],
                          x: [0, -20, 0],
                          y: [0, -20, 0]
                        }}
                        transition={{ 
                          duration: 1.8,
                          times: [0, 0.5, 1],
                          delay: 0.7,
                          ease: "easeOut"
                        }}
                        className="absolute bottom-6 left-6 w-2 h-2 bg-primary rounded-full shadow-xl shadow-primary/60"
                      />
                    </>
                  )}
                  
                  <div className="relative z-10">
                    {/* Header Section - Icon, Name, Tags */}
                    <div className="flex items-start gap-4 mb-4">
                      <motion.div 
                        animate={isCopied ? { 
                          scale: [1, 1.15, 1.1],
                          rotate: [0, 5, -5, 0],
                        } : { scale: 1, rotate: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className={`w-14 h-14 rounded-full flex items-center justify-center text-primary font-bold text-xl border flex-shrink-0 transition-all duration-500 ${
                          isCopied 
                            ? 'bg-gradient-to-br from-primary/30 to-primary/20 border-primary shadow-lg shadow-primary/30' 
                            : 'bg-primary/10 border-primary/20'
                        }`}
                      >
                        {citizen.firstName?.charAt(0) || '?'}
                      </motion.div>
                      <div className="flex-1 min-w-0">
                        {/* Full Name Display with Copy Button */}
                        <motion.button
                          onClick={() => handleCopy(fullName, citizen.nationalId, 'fullName')}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex items-center gap-2 text-lg font-bold leading-tight px-3 py-2 rounded-lg transition-all shadow-sm mb-2 w-fit ${
                            copiedId === citizen.nationalId && copiedField === 'fullName'
                              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                              : 'bg-muted hover:bg-muted/80 text-foreground hover:shadow-md'
                          }`}
                        >
                          <span>{fullName}</span>
                          {copiedId === citizen.nationalId && copiedField === 'fullName' ? (
                            <Check className="w-4 h-4 flex-shrink-0" />
                          ) : (
                            <Copy className="w-4 h-4 flex-shrink-0" />
                          )}
                        </motion.button>
                        {/* Tags */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium">
                            {citizen.genderText || (citizen.gender === 'male' ? 'ذكر' : 'أنثى')}
                          </span>
                          {/* Only show death status for 2019 registry */}
                          {citizen.registryYear === 2019 && (
                            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                              citizen.isDead 
                                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' 
                                : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            }`}>
                              {citizen.deathStatus || (citizen.isDead ? 'متوفي' : 'حي')}
                            </span>
                          )}
                          <motion.button
                            onClick={() => handleCopy(citizen.nationalId || '', citizen.nationalId, 'nationalId')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-all shadow-sm ${
                              copiedId === citizen.nationalId && copiedField === 'nationalId'
                                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                                : 'bg-muted hover:bg-muted/80 text-foreground hover:shadow-md'
                            }`}
                          >
                            <span>{citizen.nationalId}</span>
                            {copiedId === citizen.nationalId && copiedField === 'nationalId' ? (
                              <Check className="w-3 h-3 flex-shrink-0" />
                            ) : (
                              <Copy className="w-3 h-3 flex-shrink-0" />
                            )}
                          </motion.button>
                        </div>
                      </div>
                    </div>
                    
                    {/* Name Components - All in one row */}
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground font-medium">الاسم الأول:</span>
                        <motion.button
                          onClick={() => handleCopy(citizen.firstName || '', citizen.nationalId, 'firstName')}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex items-center gap-1.5 text-base font-semibold px-2.5 py-1 rounded-lg transition-all shadow-sm w-fit ${
                            copiedId === citizen.nationalId && copiedField === 'firstName'
                              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                              : 'bg-muted hover:bg-muted/80 text-foreground hover:shadow-md'
                          }`}
                        >
                          <span>{citizen.firstName || '-'}</span>
                          {copiedId === citizen.nationalId && copiedField === 'firstName' ? (
                            <Check className="w-3.5 h-3.5 flex-shrink-0" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 flex-shrink-0" />
                          )}
                        </motion.button>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground font-medium">اسم الأب:</span>
                        <motion.button
                          onClick={() => handleCopy(citizen.fatherName || '', citizen.nationalId, 'fatherName')}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex items-center gap-1.5 text-base font-semibold px-2.5 py-1 rounded-lg transition-all shadow-sm w-fit ${
                            copiedId === citizen.nationalId && copiedField === 'fatherName'
                              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                              : 'bg-muted hover:bg-muted/80 text-foreground hover:shadow-md'
                          }`}
                        >
                          <span>{citizen.fatherName || '-'}</span>
                          {copiedId === citizen.nationalId && copiedField === 'fatherName' ? (
                            <Check className="w-3.5 h-3.5 flex-shrink-0" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 flex-shrink-0" />
                          )}
                        </motion.button>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground font-medium">اسم الجد:</span>
                        <motion.button
                          onClick={() => handleCopy(citizen.grandfatherName || '', citizen.nationalId, 'grandfatherName')}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex items-center gap-1.5 text-base font-semibold px-2.5 py-1 rounded-lg transition-all shadow-sm w-fit ${
                            copiedId === citizen.nationalId && copiedField === 'grandfatherName'
                              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                              : 'bg-muted hover:bg-muted/80 text-foreground hover:shadow-md'
                          }`}
                        >
                          <span>{citizen.grandfatherName || '-'}</span>
                          {copiedId === citizen.nationalId && copiedField === 'grandfatherName' ? (
                            <Check className="w-3.5 h-3.5 flex-shrink-0" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 flex-shrink-0" />
                          )}
                        </motion.button>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground font-medium">اسم العائلة:</span>
                        <motion.button
                          onClick={() => handleCopy(citizen.lastName || '', citizen.nationalId, 'lastName')}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex items-center gap-1.5 text-base font-semibold px-2.5 py-1 rounded-lg transition-all shadow-sm w-fit ${
                            copiedId === citizen.nationalId && copiedField === 'lastName'
                              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                              : 'bg-muted hover:bg-muted/80 text-foreground hover:shadow-md'
                          }`}
                        >
                          <span>{citizen.lastName || '-'}</span>
                          {copiedId === citizen.nationalId && copiedField === 'lastName' ? (
                            <Check className="w-3.5 h-3.5 flex-shrink-0" />
                          ) : (
                            <Copy className="w-3.5 h-3.5 flex-shrink-0" />
                          )}
                        </motion.button>
                      </div>
                    </div>
                    
                    {/* Personal Details - Grid Layout */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {citizen.age !== undefined && citizen.age !== null && (
                        <div className="flex flex-col gap-1">
                          <p className="text-xs text-muted-foreground font-medium">
                            {citizen.registryYear === 2019 && citizen.isDead ? 'العمر عند الوفاة' : 'العمر'}
                          </p>
                          <span className="text-sm font-medium px-2.5 py-1 rounded-lg bg-muted text-foreground w-fit shadow-sm">
                            {citizen.age} سنة
                          </span>
                        </div>
                      )}
                      {citizen.dobText && (
                        <div className="flex flex-col gap-1">
                          <p className="text-xs text-muted-foreground font-medium">تاريخ الميلاد</p>
                          <span className="text-sm font-medium px-2.5 py-1 rounded-lg bg-muted text-foreground w-fit shadow-sm">
                            {citizen.dobText}
                          </span>
                        </div>
                      )}
                      {citizen.socialStatus && (
                        <div className="flex flex-col gap-1">
                          <p className="text-xs text-muted-foreground font-medium">الحالة الاجتماعية</p>
                          <span className="text-sm font-medium px-2.5 py-1 rounded-lg bg-muted text-foreground w-fit shadow-sm">
                            {citizen.socialStatus}
                          </span>
                        </div>
                      )}
                      {/* Phone Number */}
                      {phoneData[citizen.nationalId]?.mobile && (
                        <div className="flex flex-col gap-1">
                          <p className="text-xs text-muted-foreground font-medium">رقم الهاتف</p>
                          <motion.button
                            onClick={() => handleCopy(phoneData[citizen.nationalId].mobile || '', citizen.nationalId, 'phone')}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className={`flex items-center gap-1.5 font-medium text-sm text-primary px-2.5 py-1 rounded-lg transition-all shadow-sm w-fit ${
                              copiedId === citizen.nationalId && copiedField === 'phone'
                                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/30'
                                : 'bg-muted hover:bg-muted/80 hover:shadow-md'
                            }`}
                          >
                            <span>{phoneData[citizen.nationalId].mobile}</span>
                            {copiedId === citizen.nationalId && copiedField === 'phone' ? (
                              <Check className="w-3.5 h-3.5 flex-shrink-0" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 flex-shrink-0" />
                            )}
                          </motion.button>
                        </div>
                      )}
                      {/* Only show death date for 2019 registry */}
                      {citizen.registryYear === 2019 && citizen.isDead && citizen.deathDateText && (
                        <div className="flex flex-col gap-1">
                          <p className="text-xs text-muted-foreground font-medium">تاريخ الوفاة</p>
                          <span className="text-sm font-medium text-red-600 px-2.5 py-1 rounded-lg bg-red-100 dark:bg-red-900/30 w-fit shadow-sm">
                            {citizen.deathDateText}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Address Information */}
                    {(citizen.region || citizen.city) && (
                      <div className="space-y-2 mb-4">
                        {citizen.region && (
                          <div className="flex flex-col gap-1">
                            <p className="text-xs text-muted-foreground font-medium">المنطقة</p>
                            <span className="text-sm font-medium px-2.5 py-1 rounded-lg bg-muted text-foreground w-fit shadow-sm">
                              {citizen.region}
                            </span>
                          </div>
                        )}
                        {citizen.city && (
                          <div className="flex flex-col gap-1">
                            <p className="text-xs text-muted-foreground font-medium">المدينة</p>
                            <span className="text-sm font-medium px-2.5 py-1 rounded-lg bg-muted text-foreground w-fit shadow-sm">
                              {citizen.city}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Detailed Address Section */}
                    <div className="pt-2 border-t border-border/50 dark:border-slate-700/50">
                      {phoneData[citizen.nationalId] !== undefined ? (
                        <>
                          {phoneData[citizen.nationalId].governorate || 
                           phoneData[citizen.nationalId].city || 
                           phoneData[citizen.nationalId].area ? (
                            <div className="flex flex-col gap-1">
                              <p className="text-xs text-muted-foreground font-medium">العنوان بالتفصيل</p>
                              <span className="text-sm font-medium px-2.5 py-1 rounded-lg bg-muted text-foreground w-fit shadow-sm leading-relaxed">
                                {[
                                  phoneData[citizen.nationalId].governorate,
                                  phoneData[citizen.nationalId].city,
                                  phoneData[citizen.nationalId].area
                                ].filter(Boolean).join(' - ')}
                              </span>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs text-muted-foreground">البيانات الهاتفية غير متوفرة</p>
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
                </motion.div>
              );
              })}
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
