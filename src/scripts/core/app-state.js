// src/scripts/core/app-state.js

/**
 * AppState: كائن لإدارة حالة التطبيق العامة مثل المستخدم الحالي والوردية النشطة.
 * يتم عرضه عالمياً عبر window.AppState.
 */
class AppStateManager {
    constructor() {
        this._currentUser = null;
        this._activeShift = null;
        // يمكن إضافة المزيد من خصائص الحالة هنا
    }

    /**
     * تعيين المستخدم الحالي.
     * @param {object} user - كائن المستخدم الحالي.
     */
    setCurrentUser(user) {
        this._currentUser = user;
        console.log("AppState: Current user set to", user.username);
    }

    /**
     * جلب المستخدم الحالي.
     * @returns {object} المستخدم الحالي.
     */
    getCurrentUser() {
        return this._currentUser;
    }

    /**
     * تعيين الوردية النشطة.
     * @param {object} shift - كائن الوردية النشطة.
     */
    setActiveShift(shift) {
        this._activeShift = shift;
        console.log("AppState: Active shift set to", shift ? shift.id : "null");
    }

    /**
     * جلب الوردية النشطة.
     * @returns {object} الوردية النشطة.
     */
    getActiveShift() {
        return this._activeShift;
    }

    // يمكن إضافة المزيد من الوظائف لإدارة الحالة هنا
}

// إنشاء مثيل واحد لكائن إدارة الحالة وتصديره
const AppState = new AppStateManager();

// لجعله متاحًا عالميًا في نوافذ Electron (Renderer Process)
// يجب أن يتم ذلك عبر contextBridge في preload.js ليكون آمنًا،
// ولكن للتطوير السريع، يمكننا تعريفه كمتغير عام.
// الطريقة الأفضل: جعله يُصدر نفسه ويُستورد حيثما يلزم، بدلاً من window.AppState
// لكن بما أن الكود الحالي يستخدم window.AppState، سنلتزم بذلك مؤقتًا
window.AppState = AppState;

export default AppState; // تصدير المثيل للاستخدام في ES Modules
