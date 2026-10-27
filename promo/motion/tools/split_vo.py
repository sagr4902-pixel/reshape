# يقسّم تسجيل ElevenLabs (ملف واحد) إلى أسطر + توقيت تقريبي لكل كلمة (بلا وِسبر: الشبكة تحجب الموديلات)
import json, subprocess, sys, wave, numpy as np
W = sys.argv[1]; SRC = W + '/takes/takeA.mp3'; SR = 48000
raw = subprocess.run(['ffmpeg','-v','error','-i',SRC,'-ac','1','-ar',str(SR),'-f','f32le','-'],stdout=subprocess.PIPE,check=True).stdout
x = np.frombuffer(raw, np.float32).copy(); dur = len(x)/SR
# مقاطع الأسطر من وقفات silencedetect (‎-38dB, 0.18s)، والقطع بنص الوقفة
cuts = [(0,1.78),(2.14,5.13),(5.40,7.71),(8.01,11.24),(11.59,13.85),(14.16,16.86),(17.31,20.06),(20.35,dur)]
inner = {'l7':[(17.87,18.13,1)], 'l8':[(21.16,21.37,2)]}   # وقفة داخل السطر ← حد الكلمة رقم n
lines = {'l1':'جسمك يستطيع أكثر','l2':'برنامج مصمم لك حسب هدفك ووقتك','l3':'من يومين إلى ستة أيام في الأسبوع',
 'l4':'فيديو لكل تمرين وتكنيك صحيح من أول يوم','l5':'تسجل كل مجموعة لحظة إنهائها','l6':'والكابتن يتابع تقدمك أولا بأول',
 'l7':'ريشيب تدرب مع الكابتن محمد الصقر','l8':'سجل الآن دقيقتان فقط'}
win = int(.01*SR); n = len(x)//win
env = np.sqrt(np.mean(x[:n*win].reshape(n,win)**2,axis=1)+1e-12); db = 20*np.log10(env+1e-9)
def onset(a,b):  # أول/آخر صوت فعلي داخل [a,b]
    i,j = int(a*100), int(b*100); seg = db[i:j]; on = np.where(seg > -38)[0]
    return (a+on[0]/100, a+(on[-1]+1)/100) if len(on) else (a,b)
def dip(t, r=.12):
    i,j = max(0,int((t-r)*100)), min(n,int((t+r)*100)); return (i+int(np.argmin(env[i:j])))/100
def spread(words, s, e):
    wt = [len(w)+1.5 for w in words]; tot = sum(wt); out=[]; t=s
    for k,w in enumerate(words):
        te = e if k==len(words)-1 else dip(t + (e-s)*wt[k]/tot)
        out.append([w,t,te]); t = te
    return out
res = []
for (lid,text),(a,b) in zip(lines.items(),cuts):
    s,e = onset(a,b); ws = text.split()
    if lid in inner:
        pa,pb,k = inner[lid][0]; segs = spread(ws[:k], s, pa) + spread(ws[k:], *onset(pb,e))
    else: segs = spread(ws, s, e)
    pre, post = .03, .09; cs, ce = max(0,s-pre), min(dur,e+post)
    y = x[int(cs*SR):int(ce*SR)]
    with wave.open(f'{W}/vo/{lid}.wav','wb') as wf:
        wf.setnchannels(1); wf.setsampwidth(2); wf.setframerate(SR); wf.writeframes((np.clip(y,-1,1)*32767).astype('<i2').tobytes())
    res.append({'id':lid,'text':text,'file':f'vo/{lid}.wav','dur':round(len(y)/SR,3),'source':'elevenlabs',
                'words':[{'w':w,'s':round(ws_-cs,3),'e':round(we-cs,3)} for w,ws_,we in segs]})
    print(lid, round(cs,2), round(ce,2), ' | '.join(f'{w} {ws_-cs:.2f}' for w,ws_,we in segs))
json.dump({'voice':'ElevenLabs Abdulrahman (KfYUTAF49N2CPU3iKuMi)','source':'elevenlabs','lines':res},open(W+'/vo/words.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
