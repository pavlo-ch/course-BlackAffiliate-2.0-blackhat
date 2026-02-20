'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { 
  ArrowLeft, ArrowRight, Check, Upload, X, Plus, Loader2,
  Globe, Smartphone, Users, Palette, BarChart3, FileSearch, Send
} from 'lucide-react';

interface FileWithPreview {
  file: File;
  preview: string;
}

const TOTAL_STEPS = 8;

const STEP_ICONS = [Send, Globe, Smartphone, Users, Palette, BarChart3, FileSearch, Check];
const STEP_LABELS = [
  'Intro',
  'Geo & Offer',
  'PWA & Funnel',
  'Fan Page',
  'Creatives',
  'FB Campaigns',
  'Case',
  'Submit'
];

export default function BriefPage() {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Form data
  const [geo, setGeo] = useState('');
  const [topGames, setTopGames] = useState('');
  const [chosenGames, setChosenGames] = useState('');
  const [trafficCalcFiles, setTrafficCalcFiles] = useState<FileWithPreview[]>([]);
  const [cpc, setCpc] = useState('');
  const [cpl, setCpl] = useState('');
  const [cpr, setCpr] = useState('');
  const [cpa, setCpa] = useState('');

  const [splitTest, setSplitTest] = useState('');
  const [pwaLink, setPwaLink] = useState('');

  const [fanPageScreenshots, setFanPageScreenshots] = useState<FileWithPreview[]>([]);
  const [negativeCommentsOption, setNegativeCommentsOption] = useState('');
  const [negativeCommentsDetail, setNegativeCommentsDetail] = useState('');

  const [creativesCount, setCreativesCount] = useState('');
  const [creativesApproach, setCreativesApproach] = useState('');
  const [creativeExamples, setCreativeExamples] = useState<FileWithPreview[]>([]);

  const [campaignModel, setCampaignModel] = useState('');
  const [campaignModelDetails, setCampaignModelDetails] = useState('');
  const [testingStructure, setTestingStructure] = useState('');
  const [audiences, setAudiences] = useState<string[]>(['', '', '']);
  const [optimizationStrategy, setOptimizationStrategy] = useState('');

  const [caseScreenshots, setCaseScreenshots] = useState<FileWithPreview[]>([]);

  useEffect(() => {
    if (!isInitializing && !isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, isInitializing, router]);

  const handleMultiFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<FileWithPreview[]>>
  ) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: FileWithPreview[] = Array.from(files).map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
    }));
    setter(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const removeMultiFile = (
    index: number,
    setter: React.Dispatch<React.SetStateAction<FileWithPreview[]>>
  ) => {
    setter(prev => prev.filter((_, i) => i !== index));
  };

  const addAudience = () => {
    setAudiences(prev => [...prev, '']);
  };

  const updateAudience = (index: number, value: string) => {
    setAudiences(prev => prev.map((a, i) => i === index ? value : a));
  };

  const removeAudience = (index: number) => {
    if (audiences.length <= 1) return;
    setAudiences(prev => prev.filter((_, i) => i !== index));
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return true;
      case 1: return geo.trim() !== '' && topGames.trim() !== '' && chosenGames.trim() !== '' && cpc.trim() !== '' && cpl.trim() !== '' && cpr.trim() !== '' && cpa.trim() !== '';
      case 2: return splitTest !== '' && pwaLink.trim() !== '';
      case 3: return fanPageScreenshots.length > 0 && negativeCommentsOption !== '';
      case 4: return creativesCount.trim() !== '' && creativesApproach.trim() !== '';
      case 5: return campaignModel !== '' && testingStructure.trim() !== '' && audiences.some(a => a.trim() !== '') && optimizationStrategy.trim() !== '';
      case 6: return caseScreenshots.length > 0;
      case 7: return true;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('userName', user?.name || user?.email || 'Unknown');
      formData.append('geo', geo);
      formData.append('topGames', topGames);
      formData.append('chosenGames', chosenGames);
      formData.append('cpc', cpc);
      formData.append('cpl', cpl);
      formData.append('cpr', cpr);
      formData.append('cpa', cpa);
      formData.append('splitTest', splitTest);
      formData.append('pwaLink', pwaLink);
      formData.append('negativeComments', negativeCommentsOption + (negativeCommentsDetail ? ` — ${negativeCommentsDetail}` : ''));
      formData.append('creativesCount', creativesCount);
      formData.append('creativesApproach', creativesApproach);
      formData.append('campaignModel', campaignModel);
      formData.append('campaignModelDetails', campaignModelDetails);
      formData.append('testingStructure', testingStructure);
      formData.append('optimizationStrategy', optimizationStrategy);

      audiences.forEach((a, i) => {
        if (a.trim()) formData.append(`audience_${i}`, a);
      });

      trafficCalcFiles.forEach((f, i) => {
        formData.append(`trafficCalcFile_${i}`, f.file);
      });
      fanPageScreenshots.forEach((f, i) => {
        formData.append(`fanPageScreenshot_${i}`, f.file);
      });

      creativeExamples.forEach((f, i) => {
        formData.append(`creativeExample_${i}`, f.file);
      });

      caseScreenshots.forEach((f, i) => {
        formData.append(`caseScreenshot_${i}`, f.file);
      });

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/brief', {
        method: 'POST',
        headers: session?.access_token ? {
          'Authorization': `Bearer ${session.access_token}`
        } : {},
        body: formData,
      });

      if (response.ok) {
        setIsSubmitted(true);
      } else {
        alert('Error submitting. Please try again.');
      }
    } catch {
      alert('Error submitting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Success screen
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-black relative flex items-center justify-center">
        <div className="fixed inset-0 bg-repeat bg-fixed bg-center pointer-events-none z-0" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.15)), url(/img/lesson-bg.svg)', backgroundSize: '250% auto', filter: 'brightness(1.4) contrast(1.1)', opacity: 0.5 }} />
        <div className="relative z-10 max-w-lg mx-auto px-4 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center animate-bounce">
            <Check className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Thank you!</h1>
          <p className="text-gray-300 text-lg mb-8">
            Your brief has been received by the ADvantage team. Within 1–2 business days we will analyze your setup and get back to you with specific recommendations.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold rounded-lg transition-all duration-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const inputClasses = "w-full bg-gray-900/80 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/50 transition-all duration-200";
  const textareaClasses = `${inputClasses} min-h-[120px] resize-y`;
  const labelClasses = "block text-sm font-medium text-gray-300 mb-2";
  const radioClasses = "flex items-center gap-3 px-4 py-3 bg-gray-900/50 border border-gray-700 rounded-lg cursor-pointer transition-all duration-200 hover:border-gray-500";
  const radioActiveClasses = "flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/50 rounded-lg cursor-pointer transition-all duration-200 ring-1 ring-red-500/30";

  const MultiFileUploadZone = ({
    label,
    files,
    onSelect,
    onRemove,
    accept = "image/*,.pdf,.xlsx,.xls,.csv,.doc,.docx"
  }: {
    label: string;
    files: FileWithPreview[];
    onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: (index: number) => void;
    accept?: string;
  }) => (
    <div>
      <label className={labelClasses}>{label}</label>
      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
          {files.map((f, i) => (
            <div key={i} className="relative bg-gray-900/50 border border-gray-700 rounded-lg p-2 group">
              {f.preview ? (
                <img src={f.preview} alt="" className="w-full h-24 object-cover rounded" />
              ) : (
                <div className="w-full h-24 bg-gray-800 rounded flex items-center justify-center">
                  <Upload className="w-6 h-6 text-gray-500" />
                </div>
              )}
              <span className="text-gray-400 text-xs truncate block mt-1">{f.file.name}</span>
              <button
                onClick={() => onRemove(i)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}
      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer hover:border-red-500/50 hover:bg-red-500/5 transition-all duration-200">
        <Plus className="w-6 h-6 text-gray-500 mb-1" />
        <span className="text-gray-400 text-sm">Add file</span>
        <input type="file" className="hidden" accept={accept} multiple onChange={onSelect} />
      </label>
    </div>
  );

  // Helper to render file thumbnails in the review step
  const FilePreviewList = ({ label, files }: { label: string; files: FileWithPreview[] }) => {
    if (files.length === 0) return null;
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
        <div className="text-gray-500 text-xs uppercase tracking-wide mb-2">{label}</div>
        <div className="flex flex-wrap gap-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-2 bg-gray-800/50 rounded-lg px-2 py-1.5">
              {f.preview ? (
                <img src={f.preview} alt="" className="w-8 h-8 object-cover rounded" />
              ) : (
                <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                  <Upload className="w-3 h-3 text-gray-400" />
                </div>
              )}
              <span className="text-gray-300 text-xs max-w-[120px] truncate">{f.file.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStep = () => {
    switch (step) {
      case 0: // Intro
        return (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center">
              <FileSearch className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Setup Review</h2>
            <p className="text-gray-300 text-base mb-6 max-w-lg mx-auto leading-relaxed">
              Fill out this form so the ADvantage team can provide a detailed analysis of your setup, identify bottlenecks in your funnel, and suggest specific growth steps.
            </p>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 max-w-lg mx-auto">
              <p className="text-yellow-300 text-sm">
                ⚠️ This brief is most useful if you already have at least <strong>6,000+ views</strong> from ads in your current GEO. This way we can analyze real data, not hypotheses.
              </p>
            </div>
          </div>
        );

      case 1: // Geo & Offer
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-6 h-6 text-red-400" />
              <h2 className="text-xl font-bold text-white">Geo & Offer</h2>
            </div>
            <div>
              <label className={labelClasses}>1. Which GEO are you currently working with? <span className="text-red-400">*</span></label>
              <input type="text" className={inputClasses} placeholder="e.g. BR, IN, DE..." value={geo} onChange={e => setGeo(e.target.value)} />
            </div>
            <div>
              <label className={labelClasses}>2. What are the top games in SPY tools for your target GEO? <span className="text-red-400">*</span></label>
              <textarea className={textareaClasses} placeholder="Please specify the service name and specific slots..." value={topGames} onChange={e => setTopGames(e.target.value)} />
            </div>
            <div>
              <label className={labelClasses}>3. Which casino games did you choose to test? <span className="text-red-400">*</span></label>
              <textarea className={textareaClasses} placeholder="Is this game present in your current casino offer..." value={chosenGames} onChange={e => setChosenGames(e.target.value)} />
            </div>
            <MultiFileUploadZone
              label="4. Upload your traffic calculations (from calculator, target ROI ≈ 40%)"
              files={trafficCalcFiles}
              onSelect={e => handleMultiFileSelect(e, setTrafficCalcFiles)}
              onRemove={i => removeMultiFile(i, setTrafficCalcFiles)}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClasses}>CPC <span className="text-red-400">*</span></label>
                <input type="text" className={inputClasses} placeholder="$0.00" value={cpc} onChange={e => setCpc(e.target.value)} />
              </div>
              <div>
                <label className={labelClasses}>CPL <span className="text-red-400">*</span></label>
                <input type="text" className={inputClasses} placeholder="$0.00" value={cpl} onChange={e => setCpl(e.target.value)} />
              </div>
              <div>
                <label className={labelClasses}>CPR <span className="text-red-400">*</span></label>
                <input type="text" className={inputClasses} placeholder="$0.00" value={cpr} onChange={e => setCpr(e.target.value)} />
              </div>
              <div>
                <label className={labelClasses}>CPA <span className="text-red-400">*</span></label>
                <input type="text" className={inputClasses} placeholder="$0.00" value={cpa} onChange={e => setCpa(e.target.value)} />
              </div>
            </div>
          </div>
        );

      case 2: // PWA & Funnel
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Smartphone className="w-6 h-6 text-red-400" />
              <h2 className="text-xl font-bold text-white">PWA & Funnel</h2>
            </div>
            <div>
              <label className={labelClasses}>5. Are you running a split test with at least 2 different PWA designs? <span className="text-red-400">*</span></label>
              <div className="space-y-2">
                {['Yes, 2+ designs', 'No, using only one'].map(option => (
                  <div
                    key={option}
                    className={splitTest === option ? radioActiveClasses : radioClasses}
                    onClick={() => setSplitTest(option)}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${splitTest === option ? 'border-red-500 bg-red-500' : 'border-gray-500'}`}>
                      {splitTest === option && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className="text-gray-200">{option}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label className={labelClasses}>6. Link to your PWA app or split test <span className="text-red-400">*</span></label>
              <input type="url" className={inputClasses} placeholder="https://..." value={pwaLink} onChange={e => setPwaLink(e.target.value)} />
            </div>
          </div>
        );

      case 3: // Fan Page
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-red-400" />
              <h2 className="text-xl font-bold text-white">Fan Page & Audience Reaction</h2>
            </div>
            <MultiFileUploadZone
              label="7. Screenshots of your Fan Page design (avatar, cover, name, description, posts) *"
              files={fanPageScreenshots}
              onSelect={e => handleMultiFileSelect(e, setFanPageScreenshots)}
              onRemove={i => removeMultiFile(i, setFanPageScreenshots)}
              accept="image/*"
            />
            <div>
              <label className={labelClasses}>8. Does your advertising attract negative comments? <span className="text-red-400">*</span></label>
              <div className="space-y-2">
                {['Yes, a lot of negative comments', 'Yes, but rarely', 'No, comments are neutral/positive', 'Not tracking'].map(option => (
                  <div
                    key={option}
                    className={negativeCommentsOption === option ? radioActiveClasses : radioClasses}
                    onClick={() => setNegativeCommentsOption(option)}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${negativeCommentsOption === option ? 'border-red-500 bg-red-500' : 'border-gray-500'}`}>
                      {negativeCommentsOption === option && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className="text-gray-200">{option}</span>
                  </div>
                ))}
              </div>
              <input type="text" className={`${inputClasses} mt-3`} placeholder="Additional details (optional)" value={negativeCommentsDetail} onChange={e => setNegativeCommentsDetail(e.target.value)} />
            </div>
          </div>
        );

      case 4: // Creatives
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <Palette className="w-6 h-6 text-red-400" />
              <h2 className="text-xl font-bold text-white">Creatives & Approaches</h2>
            </div>
            <div>
              <label className={labelClasses}>9. How many different creatives have you tested? <span className="text-red-400">*</span></label>
              <input type="number" className={inputClasses} placeholder="Number..." value={creativesCount} onChange={e => setCreativesCount(e.target.value)} />
            </div>
            <div>
              <label className={labelClasses}>10. Describe your current creative approaches <span className="text-red-400">*</span></label>
              <textarea className={textareaClasses} placeholder="Emotion, bonus, game mechanics, story, social proof..." value={creativesApproach} onChange={e => setCreativesApproach(e.target.value)} />
            </div>
            <MultiFileUploadZone
              label="Creative examples (optional)"
              files={creativeExamples}
              onSelect={e => handleMultiFileSelect(e, setCreativeExamples)}
              onRemove={i => removeMultiFile(i, setCreativeExamples)}
              accept="image/*,video/*"
            />
          </div>
        );

      case 5: // FB Campaigns
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-6 h-6 text-red-400" />
              <h2 className="text-xl font-bold text-white">Facebook Campaign Structure</h2>
            </div>
            <div>
              <label className={labelClasses}>11. Which campaign model do you use? <span className="text-red-400">*</span></label>
              <div className="space-y-2">
                {['ABO', 'CBO', 'Mix'].map(option => (
                  <div
                    key={option}
                    className={campaignModel === option ? radioActiveClasses : radioClasses}
                    onClick={() => setCampaignModel(option)}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${campaignModel === option ? 'border-red-500 bg-red-500' : 'border-gray-500'}`}>
                      {campaignModel === option && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <span className="text-gray-200">{option}</span>
                  </div>
                ))}
              </div>
              <input type="text" className={`${inputClasses} mt-3`} placeholder="Details if needed (optional)" value={campaignModelDetails} onChange={e => setCampaignModelDetails(e.target.value)} />
            </div>
            <div>
              <label className={labelClasses}>12. What structure do you use for testing creatives? <span className="text-red-400">*</span></label>
              <input type="text" className={inputClasses} placeholder="e.g. 1:3:3, 1:1:1 (Campaign : Ad sets : Ads)" value={testingStructure} onChange={e => setTestingStructure(e.target.value)} />
            </div>
            <div>
              <label className={labelClasses}>13. Describe the audiences you have tested <span className="text-red-400">*</span></label>
              <div className="space-y-3">
                {audiences.map((audience, i) => (
                  <div key={i} className="flex gap-2">
                    <textarea
                      className={`${inputClasses} min-h-[80px]`}
                      placeholder={`Audience ${i + 1} — M24–50, Advantage+ Audience, mobile only...`}
                      value={audience}
                      onChange={e => updateAudience(i, e.target.value)}
                    />
                    {audiences.length > 1 && (
                      <button onClick={() => removeAudience(i)} className="text-gray-500 hover:text-red-400 transition-colors self-start mt-3">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={addAudience}
                className="mt-3 flex items-center gap-2 text-red-400 hover:text-red-300 text-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add another audience
              </button>
            </div>
            <div>
              <label className={labelClasses}>14. Describe the optimization strategy from the Road Map you are using <span className="text-red-400">*</span></label>
              <textarea className={textareaClasses} placeholder="Describe your strategy..." value={optimizationStrategy} onChange={e => setOptimizationStrategy(e.target.value)} />
            </div>
          </div>
        );

      case 6: // Case
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <FileSearch className="w-6 h-6 text-red-400" />
              <h2 className="text-xl font-bold text-white">Case for Analysis</h2>
            </div>
            <p className="text-gray-400 text-sm">
              If you have a specific traffic case you'd like us to review, upload full screenshots with as many metrics and dates visible as possible.
            </p>
            <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
              <p className="text-gray-300 text-sm mb-2">Minimum required:</p>
              <ul className="text-gray-400 text-sm space-y-1 list-disc list-inside">
                <li>1 screenshot from Ad Sets level</li>
                <li>1 screenshot from Ads level</li>
              </ul>
            </div>
            <MultiFileUploadZone
              label="Case screenshots *"
              files={caseScreenshots}
              onSelect={e => handleMultiFileSelect(e, setCaseScreenshots)}
              onRemove={i => removeMultiFile(i, setCaseScreenshots)}
              accept="image/*"
            />
          </div>
        );

      case 7: // Review
        return (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <Check className="w-6 h-6 text-green-400" />
              <h2 className="text-xl font-bold text-white">Review your answers</h2>
            </div>

            {[
              { label: 'GEO', value: geo },
              { label: 'Top SPY Games', value: topGames },
              { label: 'Casino Games for Test', value: chosenGames },
              { label: 'CPC / CPL / CPR / CPA', value: [cpc, cpl, cpr, cpa].filter(v => v).join(' / ') || '—' },
              { label: 'PWA Split Test', value: splitTest },
              { label: 'PWA Link', value: pwaLink || '—' },
              { label: 'Negative Comments', value: negativeCommentsOption ? (negativeCommentsOption + (negativeCommentsDetail ? ` — ${negativeCommentsDetail}` : '')) : '—' },
              { label: 'Creatives Tested', value: creativesCount || '—' },
              { label: 'Creative Approaches', value: creativesApproach || '—' },
              { label: 'Campaign Model', value: campaignModel + (campaignModelDetails ? ` (${campaignModelDetails})` : '') },
              { label: 'Testing Structure', value: testingStructure || '—' },
              { label: 'Optimization Strategy', value: optimizationStrategy || '—' },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
                <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">{label}</div>
                <div className="text-gray-200 text-sm whitespace-pre-line">{value || '—'}</div>
              </div>
            ))}

            {audiences.some(a => a.trim()) && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
                <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Audiences</div>
                {audiences.filter(a => a.trim()).map((a, i) => (
                  <div key={i} className="text-gray-200 text-sm mb-1">• Audience {i + 1}: {a}</div>
                ))}
              </div>
            )}

            <FilePreviewList label="📊 Traffic Calculations" files={trafficCalcFiles} />
            <FilePreviewList label="📄 Fan Page Screenshots" files={fanPageScreenshots} />
            <FilePreviewList label="🎨 Creative Examples" files={creativeExamples} />
            <FilePreviewList label="📸 Case Screenshots" files={caseScreenshots} />

            {trafficCalcFiles.length === 0 && fanPageScreenshots.length === 0 && creativeExamples.length === 0 && caseScreenshots.length === 0 && (
              <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3">
                <div className="text-gray-500 text-xs uppercase tracking-wide mb-1">Files</div>
                <div className="text-gray-500 text-sm">No files attached</div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black relative">
      <div className="fixed inset-0 bg-repeat bg-fixed bg-center pointer-events-none z-0" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,0.15), rgba(0,0,0,0.15)), url(/img/lesson-bg.svg)', backgroundSize: '250% auto', filter: 'brightness(1.4) contrast(1.1)', opacity: 0.5 }} />
      <div className="relative z-10">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {/* Back button */}
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-red-400 transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </Link>

          {/* Progress bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              {STEP_LABELS.map((label, i) => {
                const Icon = STEP_ICONS[i];
                const isActive = i === step;
                const isCompleted = i < step;
                return (
                  <div key={i} className="flex flex-col items-center gap-1 flex-1">
                    <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isActive ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110' :
                      isCompleted ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                      'bg-gray-800 text-gray-500 border border-gray-700'
                    }`}>
                      {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className={`text-[10px] sm:text-xs text-center hidden sm:block ${isActive ? 'text-red-400 font-medium' : isCompleted ? 'text-green-400' : 'text-gray-600'}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(step / (TOTAL_STEPS - 1)) * 100}%` }}
              />
            </div>
            <div className="text-right mt-1">
              <span className="text-gray-500 text-xs">{step + 1} / {TOTAL_STEPS}</span>
            </div>
          </div>

          {/* Form card */}
          <div className="bg-gradient-to-b from-[#1a1d22] to-[#0f1012] border border-gray-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
            {renderStep()}

            {/* Navigation buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-800">
              {step > 0 ? (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="flex items-center gap-2 px-5 py-2.5 text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-all duration-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              ) : <div />}
              
              {step < TOTAL_STEPS - 1 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canProceed()}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-lg hover:shadow-red-500/25 transition-all duration-200"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed text-white font-medium rounded-lg shadow-lg hover:shadow-green-500/25 transition-all duration-200"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Brief
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
