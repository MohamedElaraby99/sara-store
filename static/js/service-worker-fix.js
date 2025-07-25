/**
 * Service Worker Fix Script
 * يمكن تشغيل هذا السكريبت في وحدة تحكم المتصفح لإصلاح مشاكل Service Worker
 */

(function() {
    'use strict';

    console.log('🔧 Service Worker Fix Script Starting...');

    async function fixServiceWorker() {
        try {
            // التحقق من دعم Service Worker
            if (!('serviceWorker' in navigator)) {
                console.log('❌ Service Worker غير مدعوم في هذا المتصفح');
                return;
            }

            console.log('📋 الخطوة 1: إلغاء تسجيل Service Worker الحالي...');
            
            // إلغاء تسجيل Service Worker الحالي
            const registration = await navigator.serviceWorker.getRegistration();
            if (registration) {
                await registration.unregister();
                console.log('✅ تم إلغاء تسجيل Service Worker بنجاح');
            } else {
                console.log('ℹ️ لا يوجد Service Worker مسجل حالياً');
            }

            console.log('📋 الخطوة 2: مسح جميع التخزين المؤقت...');
            
            // مسح جميع التخزين المؤقت
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                console.log('📦 التخزين المؤقت الموجود:', cacheNames);
                
                await Promise.all(cacheNames.map(name => caches.delete(name)));
                console.log('✅ تم مسح جميع التخزين المؤقت بنجاح');
            } else {
                console.log('ℹ️ Cache API غير مدعوم');
            }

            console.log('📋 الخطوة 3: إعادة تسجيل Service Worker...');
            
            // إعادة تسجيل Service Worker
            const newRegistration = await navigator.serviceWorker.register('/static/js/service-worker.js');
            console.log('✅ تم تسجيل Service Worker الجديد بنجاح');
            console.log('📊 معلومات التسجيل:', {
                scope: newRegistration.scope,
                active: !!newRegistration.active,
                installing: !!newRegistration.installing,
                waiting: !!newRegistration.waiting
            });

            console.log('📋 الخطوة 4: إعادة تحميل الصفحة...');
            
            // إعادة تحميل الصفحة بعد ثانيتين
            setTimeout(() => {
                console.log('🔄 إعادة تحميل الصفحة...');
                window.location.reload();
            }, 2000);

        } catch (error) {
            console.error('❌ خطأ أثناء إصلاح Service Worker:', error);
            console.log('💡 يمكنك المحاولة مرة أخرى أو الاتصال بالدعم الفني');
        }
    }

    // إضافة الدالة للكائن العام
    window.fixServiceWorker = fixServiceWorker;

    // عرض التعليمات
    console.log(`
🎯 Service Worker Fix Script جاهز!

لتشغيل الإصلاح، اكتب في وحدة التحكم:
fixServiceWorker()

أو انقر على الرابط التالي:
https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers

📝 ملاحظات:
- سيتم إعادة تحميل الصفحة تلقائياً بعد الإصلاح
- إذا استمرت المشكلة، جرب مسح ذاكرة التخزين المؤقت للمتصفح
- تأكد من أن الموقع يعمل على HTTPS أو localhost
    `);

    // تشغيل الإصلاح تلقائياً إذا كان هناك خطأ في Service Worker
    if (window.location.hash === '#fix-sw') {
        console.log('🚀 تشغيل الإصلاح التلقائي...');
        fixServiceWorker();
    }

})(); 