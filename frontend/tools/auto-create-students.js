// 1. Повторное объявление класса с функцией insert (чтобы Console могла понимать и запускать его независимо)
class TemporaryStudentService {
    constructor() {
        this.baseUrl = "http://127.0.0.1:8000/api/students/";
    }

    // Функция преобразования данных в snake_case (если у вас её еще нет, она автоматически переведет fullName -> full_name, groupName -> group_name...)
    _mapToSnakeCase(obj) {
        const snakeObj = {};
        for (let key in obj) {
            const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
            snakeObj[snakeKey] = obj[key];
        }
        return snakeObj;
    }

    async insert(formData) {
        const backendData = this._mapToSnakeCase(formData);
        return await fetch(this.baseUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(backendData)
        });
    }
}

// 2. Функция для случайной генерации 100 студентов с русскими именами
function generate100Students() {
    const firstNames = ["Иван", "Александр", "Сергей", "Дмитрий", "Алексей", "Максим", "Андрей", "Артем", "Николай", "Михаил"];
    const lastNames = ["Иванов", "Петров", "Смирнов", "Попов", "Соколов", "Лебедев", "Козлов", "Новиков", "Морозов", "Петров"];
    const groups = ["K3101", "K3102", "M3201", "N3305", "P3400"];
    const terms = ["2026-09-01", "2026-10-15", "2027-01-01"];
    
    // Используем Set для гарантированного хранения уникальных 6-значных ID (без дубликатов)
    const uniqueIsuIds = new Set();
    while (uniqueIsuIds.size < 100) {
        // Генерирует случайное число от 100000 до 999999
        const randomId = Math.floor(100000 + Math.random() * 900000);
        uniqueIsuIds.add(randomId);
    }
    
    // Превращаем Set в массив для удобного извлечения по индексу
    const isuIdList = Array.from(uniqueIsuIds);
    const students = [];
    
    for (let i = 0; i < 100; i++) {
        const randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
        const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];
        
        students.push({
            fullName: `${randomFirst} ${randomLast}`, // Чисто текстовая строка, проходит регулярное выражение /\d/
            groupName: groups[Math.floor(Math.random() * groups.length)],
            isuId: isuIdList[i], // Гарантированно уникальный 6-значный ID
            dormitoryNumber: Math.floor(Math.random() * 10) + 1,
            roomNumber: `${Math.floor(Math.random() * 500) + 100}B`,
            settlementTerm: terms[Math.floor(Math.random() * terms.length)]
        });
    }
    return students;
}

// 3. Функция для непрерывного выполнения отправки данных
async function runAutoInsert() {
    const service = new TemporaryStudentService();
    const studentList = generate100Students();
    
    console.log(`🚀 Началась автоматическая отправка данных 100 студентов на ${service.baseUrl}...`);
    
    let success = 0;
    let fail = 0;

    for (let i = 0; i < studentList.length; i++) {
        const student = studentList[i];
        try {
            const response = await service.insert(student);
            if (response.ok) {
                success++;
                console.log(`✅ [${i+1}/100] Успешно: ${student.fullName} (ISU: ${student.isuId})`);
            } else {
                fail++;
                console.error(`❌ [${i+1}/100] Ошибка от Backend: Код ${response.status}`);
            }
        } catch (err) {
            fail++;
            console.error(`❌ [${i+1}/100] Ошибка сетевого соединения:`, err.message);
        }
        // Задержка 40 мс на каждом шаге, чтобы SQLite работал плавно и без зависаний
        await new Promise(res => setTimeout(res, 40));
    }
    
    console.log(`\n🎉 ЗАВЕРШЕНО: Успешно ${success}/100, Ошибка ${fail}/100.`);
}

// 4. Немедленный запуск скрипта
runAutoInsert();
