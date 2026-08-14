import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root or child directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });
if (!process.env.VITE_SUPABASE_URL) {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 
  process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or Supabase Key in .env file!');
  process.exit(1);
}

const isUsingServiceRole = Boolean(
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/**
 * 21-Day SQL Curriculum Progression Dataset
 */
const challenges = [
  // ==========================================
  // DAYS 1 - 5: BASICS (SELECT, WHERE, ORDER BY, LIMIT)
  // ==========================================
  {
    day_number: 1,
    title: 'Top Performing Students',
    difficulty: 'Easy',
    points: 50,
    description: `Welcome to Day 1! 
Retrieve the \`id\`, \`full_name\`, and \`gpa\` of all active students with a GPA of 3.5 or higher. 
Sort the results by \`gpa\` in descending order, and limit the output to the top 5 students.`,
    init_sql: `CREATE TABLE students (
  id INT PRIMARY KEY,
  full_name TEXT,
  major TEXT,
  gpa REAL,
  is_active INT
);

INSERT INTO students VALUES 
(1, 'Alice Johnson', 'Computer Science', 3.85, 1),
(2, 'Bob Smith', 'Mathematics', 3.20, 1),
(3, 'Charlie Brown', 'Computer Science', 3.92, 1),
(4, 'Diana Prince', 'Physics', 3.65, 0),
(5, 'Evan Wright', 'Electrical Eng', 3.78, 1),
(6, 'Fiona Gallagher', 'Computer Science', 3.90, 1),
(7, 'George Clark', 'Mathematics', 3.45, 1),
(8, 'Hannah Abbott', 'Physics', 3.98, 1);`,
    solution_query: `SELECT id, full_name, gpa 
FROM students 
WHERE is_active = 1 AND gpa >= 3.5 
ORDER BY gpa DESC 
LIMIT 5;`,
  },
  {
    day_number: 2,
    title: 'Engineering Department High Earners',
    difficulty: 'Easy',
    points: 50,
    description: `Find all employees in the 'Engineering' department who earn a salary strictly greater than 80,000.
Return their \`id\`, \`name\`, \`department\`, and \`salary\` sorted alphabetically by \`name\`.`,
    init_sql: `CREATE TABLE employees (
  id INT PRIMARY KEY,
  name TEXT,
  department TEXT,
  salary INT,
  hire_year INT
);

INSERT INTO employees VALUES 
(101, 'Alex Rivera', 'Engineering', 95000, 2021),
(102, 'Bethany Joy', 'Marketing', 68000, 2022),
(103, 'Carlos Santana', 'Engineering', 78000, 2020),
(104, 'Danielle Reed', 'Engineering', 115000, 2019),
(105, 'Edward Norton', 'Sales', 85000, 2023),
(106, 'Fatima Al-Sayed', 'Engineering', 88000, 2022),
(107, 'Greg House', 'Engineering', 82000, 2024);`,
    solution_query: `SELECT id, name, department, salary 
FROM employees 
WHERE department = 'Engineering' AND salary > 80000 
ORDER BY name ASC;`,
  },
  {
    day_number: 3,
    title: 'Catalog Search with Pattern Matching',
    difficulty: 'Easy',
    points: 50,
    description: `Search the product inventory for items whose name contains 'Pro' (case-sensitive) and have a unit price between 20.00 and 150.00 inclusive.
Return \`product_id\`, \`product_name\`, and \`price\` ordered by \`price\` ascending.`,
    init_sql: `CREATE TABLE products (
  product_id INT PRIMARY KEY,
  product_name TEXT,
  category TEXT,
  price REAL,
  stock_quantity INT
);

INSERT INTO products VALUES 
(1, 'SQL Keyboard Pro', 'Hardware', 129.99, 45),
(2, 'Basic USB Mouse', 'Hardware', 15.50, 120),
(3, 'Monitor Stand Pro', 'Accessories', 49.99, 30),
(4, 'Desk Pad Pro Max', 'Accessories', 25.00, 80),
(5, 'Noise Cancelling Headphones', 'Audio', 199.99, 15),
(6, 'Webcam Pro HD', 'Electronics', 79.99, 60),
(7, 'Budget Stylus', 'Accessories', 9.99, 200);`,
    solution_query: `SELECT product_id, product_name, price 
FROM products 
WHERE product_name LIKE '%Pro%' AND price BETWEEN 20.00 AND 150.00 
ORDER BY price ASC;`,
  },
  {
    day_number: 4,
    title: 'Distinct Course Disciplines',
    difficulty: 'Easy',
    points: 50,
    description: `Extract unique department disciplines offering courses with 3 or more credits.
Return the distinct \`department\` as \`offering_dept\` sorted in alphabetical order.`,
    init_sql: `CREATE TABLE courses (
  course_code TEXT PRIMARY KEY,
  course_name TEXT,
  department TEXT,
  credits INT
);

INSERT INTO courses VALUES 
('CS101', 'Intro to Programming', 'Computer Science', 4),
('CS202', 'Data Structures', 'Computer Science', 4),
('MATH150', 'Linear Algebra', 'Mathematics', 3),
('PHYS101', 'General Physics I', 'Physics', 4),
('CS305', 'Database Systems', 'Computer Science', 3),
('ENG101', 'Technical Writing', 'Humanities', 2),
('MATH200', 'Calculus II', 'Mathematics', 4),
('CHEM100', 'Lab Safety', 'Chemistry', 1);`,
    solution_query: `SELECT DISTINCT department AS offering_dept 
FROM courses 
WHERE credits >= 3 
ORDER BY offering_dept ASC;`,
  },
  {
    day_number: 5,
    title: 'Patient Triage with NULL Checking',
    difficulty: 'Easy',
    points: 50,
    description: `Find all emergency patients admitted in rooms ('ER-1', 'ER-2', 'ER-3') who have an assigned attending physician (\`attending_physician\` is NOT NULL).
Return \`patient_id\`, \`patient_name\`, \`room_number\`, and \`attending_physician\` ordered by \`patient_id\` ascending.`,
    init_sql: `CREATE TABLE patients (
  patient_id INT PRIMARY KEY,
  patient_name TEXT,
  room_number TEXT,
  attending_physician TEXT,
  admission_priority INT
);

INSERT INTO patients VALUES 
(1, 'John Doe', 'ER-1', 'Dr. Watson', 1),
(2, 'Jane Roe', 'ER-2', NULL, 2),
(3, 'Sam Spade', 'ER-3', 'Dr. House', 1),
(4, 'Lucy Heart', 'ICU-1', 'Dr. Watson', 1),
(5, 'Markus Wright', 'ER-1', 'Dr. Grey', 3),
(6, 'Elena Vance', 'ER-4', 'Dr. Grey', 2),
(7, 'David Kim', 'ER-2', 'Dr. House', 1);`,
    solution_query: `SELECT patient_id, patient_name, room_number, attending_physician 
FROM patients 
WHERE room_number IN ('ER-1', 'ER-2', 'ER-3') 
  AND attending_physician IS NOT NULL 
ORDER BY patient_id ASC;`,
  },

  // ==========================================
  // DAYS 6 - 10: AGGREGATIONS & GROUPING
  // ==========================================
  {
    day_number: 6,
    title: 'Regional Sales Performance',
    difficulty: 'Medium',
    points: 100,
    description: `Calculate regional sales statistics. 
For each \`region\`, compute the total revenue as \`total_revenue\` and average sale as \`avg_sale\` (rounded to 2 decimal places). 
Sort by \`total_revenue\` descending.`,
    init_sql: `CREATE TABLE regional_sales (
  sale_id INT PRIMARY KEY,
  region TEXT,
  sale_amount REAL,
  sale_date TEXT
);

INSERT INTO regional_sales VALUES 
(1, 'North America', 12500.50, '2026-01-10'),
(2, 'Europe', 8400.00, '2026-01-11'),
(3, 'North America', 16200.00, '2026-01-12'),
(4, 'Asia Pacific', 22000.75, '2026-01-13'),
(5, 'Europe', 11500.25, '2026-01-14'),
(6, 'Asia Pacific', 18400.00, '2026-01-15'),
(7, 'Latin America', 6200.00, '2026-01-16'),
(8, 'North America', 9800.00, '2026-01-17');`,
    solution_query: `SELECT region, SUM(sale_amount) AS total_revenue, ROUND(AVG(sale_amount), 2) AS avg_sale 
FROM regional_sales 
GROUP BY region 
ORDER BY total_revenue DESC;`,
  },
  {
    day_number: 7,
    title: 'Customer Order Frequency & Spend',
    difficulty: 'Medium',
    points: 100,
    description: `Analyze customer ordering patterns.
Find the total number of orders (\`order_count\`) and total money spent (\`total_spent\`) for each \`customer_id\`.
Only include customers who have placed 2 or more orders. Sort by \`total_spent\` descending.`,
    init_sql: `CREATE TABLE orders (
  order_id INT PRIMARY KEY,
  customer_id INT,
  order_total REAL,
  order_status TEXT
);

INSERT INTO orders VALUES 
(1001, 501, 150.00, 'completed'),
(1002, 502, 85.50, 'completed'),
(1003, 501, 220.00, 'completed'),
(1004, 503, 45.00, 'completed'),
(1005, 502, 310.25, 'completed'),
(1006, 501, 95.00, 'completed'),
(1007, 504, 600.00, 'completed'),
(1008, 502, 140.00, 'completed');`,
    solution_query: `SELECT customer_id, COUNT(order_id) AS order_count, SUM(order_total) AS total_spent 
FROM orders 
GROUP BY customer_id 
HAVING COUNT(order_id) >= 2 
ORDER BY total_spent DESC;`,
  },
  {
    day_number: 8,
    title: 'Department Salary Benchmarks (HAVING Filter)',
    difficulty: 'Medium',
    points: 100,
    description: `Identify high-compensation departments with substantial teams.
Calculate the average salary as \`avg_salary\` and employee headcount as \`headcount\` per department.
Filter only for departments that have more than 2 employees AND an average salary exceeding 75,000. Sort by \`avg_salary\` DESC.`,
    init_sql: `CREATE TABLE staff (
  emp_id INT PRIMARY KEY,
  emp_name TEXT,
  department TEXT,
  salary INT
);

INSERT INTO staff VALUES 
(1, 'Alice', 'Engineering', 95000),
(2, 'Bob', 'Engineering', 85000),
(3, 'Charlie', 'Engineering', 105000),
(4, 'Diana', 'Marketing', 65000),
(5, 'Evan', 'Marketing', 70000),
(6, 'Fiona', 'Product', 80000),
(7, 'George', 'Product', 90000),
(8, 'Hannah', 'Product', 85000),
(9, 'Ian', 'Support', 50000);`,
    solution_query: `SELECT department, COUNT(emp_id) AS headcount, AVG(salary) AS avg_salary 
FROM staff 
GROUP BY department 
HAVING COUNT(emp_id) > 2 AND AVG(salary) > 75000 
ORDER BY avg_salary DESC;`,
  },
  {
    day_number: 9,
    title: 'Conditional Inventory Categorization (CASE WHEN)',
    difficulty: 'Medium',
    points: 100,
    description: `Classify warehouse items into stock tiers:
- If \`quantity\` >= 100 then 'Optimal'
- If \`quantity\` BETWEEN 30 AND 99 then 'Moderate'
- Else 'Low Stock'
Return \`item_id\`, \`item_name\`, \`quantity\`, and the computed status as \`stock_status\`, ordered by \`quantity\` ASC.`,
    init_sql: `CREATE TABLE warehouse (
  item_id INT PRIMARY KEY,
  item_name TEXT,
  quantity INT,
  warehouse_location TEXT
);

INSERT INTO warehouse VALUES 
(1, 'Microcontrollers', 150, 'Aisle 1'),
(2, 'Soldering Wire', 25, 'Aisle 2'),
(3, 'Breadboards', 85, 'Aisle 1'),
(4, 'OLED Displays', 12, 'Aisle 3'),
(5, 'Resistor Kits', 350, 'Aisle 2'),
(6, 'Capacitors Pack', 95, 'Aisle 2'),
(7, 'Jumper Wires', 5, 'Aisle 1');`,
    solution_query: `SELECT item_id, item_name, quantity, 
  CASE 
    WHEN quantity >= 100 THEN 'Optimal' 
    WHEN quantity BETWEEN 30 AND 99 THEN 'Moderate' 
    ELSE 'Low Stock' 
  END AS stock_status 
FROM warehouse 
ORDER BY quantity ASC;`,
  },
  {
    day_number: 10,
    title: 'High-Engagement Content Analytics',
    difficulty: 'Medium',
    points: 100,
    description: `Analyze web traffic logs to find viral articles.
For each \`article_slug\`, find the total views as \`total_views\` and the number of unique visitors as \`unique_visitors\`.
Only return articles with 3 or more unique visitors, ordered by \`unique_visitors\` DESC.`,
    init_sql: `CREATE TABLE page_views (
  view_id INT PRIMARY KEY,
  article_slug TEXT,
  user_ip TEXT,
  view_duration_sec INT
);

INSERT INTO page_views VALUES 
(1, 'learn-sql-joins', '192.168.1.1', 120),
(2, 'learn-sql-joins', '192.168.1.2', 45),
(3, 'react-hooks-guide', '192.168.1.1', 300),
(4, 'learn-sql-joins', '192.168.1.3', 180),
(5, 'postgres-indexing', '192.168.1.4', 210),
(6, 'learn-sql-joins', '192.168.1.1', 90),
(7, 'postgres-indexing', '192.168.1.5', 140),
(8, 'postgres-indexing', '192.168.1.6', 400),
(9, 'react-hooks-guide', '192.168.1.2', 95);`,
    solution_query: `SELECT article_slug, COUNT(view_id) AS total_views, COUNT(DISTINCT user_ip) AS unique_visitors 
FROM page_views 
GROUP BY article_slug 
HAVING COUNT(DISTINCT user_ip) >= 3 
ORDER BY unique_visitors DESC;`,
  },

  // ==========================================
  // DAYS 11 - 15: RELATIONAL QUERIES & SUBQUERIES
  // ==========================================
  {
    day_number: 11,
    title: 'Authors & Published Titles (INNER JOIN)',
    difficulty: 'Medium',
    points: 150,
    description: `Match published books with author details.
Join \`authors\` and \`books\` on \`author_id\`.
Return \`book_title\`, \`author_name\`, \`genre\`, and \`publication_year\` for all books published after 2010. Sort by \`publication_year\` DESC.`,
    init_sql: `CREATE TABLE authors (
  author_id INT PRIMARY KEY,
  author_name TEXT,
  country TEXT
);

CREATE TABLE books (
  book_id INT PRIMARY KEY,
  author_id INT,
  book_title TEXT,
  genre TEXT,
  publication_year INT
);

INSERT INTO authors VALUES 
(1, 'Martin Kleppmann', 'UK'),
(2, 'Robert C. Martin', 'USA'),
(3, 'Donald Knuth', 'USA'),
(4, 'Kyle Simpson', 'USA');

INSERT INTO books VALUES 
(101, 1, 'Designing Data-Intensive Applications', 'Databases', 2017),
(102, 2, 'Clean Code', 'Software Engineering', 2008),
(103, 2, 'Clean Architecture', 'Software Engineering', 2017),
(104, 3, 'The Art of Computer Programming', 'Algorithms', 1968),
(105, 4, 'You Don''t Know JS', 'Web Dev', 2015);`,
    solution_query: `SELECT b.book_title, a.author_name, b.genre, b.publication_year 
FROM books b 
INNER JOIN authors a ON b.author_id = a.author_id 
WHERE b.publication_year > 2010 
ORDER BY b.publication_year DESC;`,
  },
  {
    day_number: 12,
    title: 'Dormant Customers (LEFT JOIN with NULL Check)',
    difficulty: 'Medium',
    points: 150,
    description: `Identify churned or registered customers who have never placed an order.
Perform a \`LEFT JOIN\` between \`clients\` and \`client_orders\` on \`client_id\`.
Return \`client_id\`, \`client_name\`, and \`signup_date\` for clients with no matching orders. Sort by \`client_id\` ASC.`,
    init_sql: `CREATE TABLE clients (
  client_id INT PRIMARY KEY,
  client_name TEXT,
  email TEXT,
  signup_date TEXT
);

CREATE TABLE client_orders (
  order_id INT PRIMARY KEY,
  client_id INT,
  amount REAL
);

INSERT INTO clients VALUES 
(1, 'Acme Corp', 'contact@acme.com', '2025-01-01'),
(2, 'Stark Industries', 'tony@stark.com', '2025-01-15'),
(3, 'Wayne Enterprises', 'bruce@wayne.com', '2025-02-01'),
(4, 'Cyberdyne Systems', 'miles@cyberdyne.com', '2025-02-10'),
(5, 'Oscorp Technologies', 'norman@oscorp.com', '2025-03-01');

INSERT INTO client_orders VALUES 
(101, 1, 5000.00),
(102, 2, 12000.00),
(103, 1, 3500.00),
(104, 3, 8500.00);`,
    solution_query: `SELECT c.client_id, c.client_name, c.signup_date 
FROM clients c 
LEFT JOIN client_orders o ON c.client_id = o.client_id 
WHERE o.order_id IS NULL 
ORDER BY c.client_id ASC;`,
  },
  {
    day_number: 13,
    title: 'Multi-Table Academic Enrollment Roster',
    difficulty: 'Medium',
    points: 150,
    description: `Build an academic roster combining students, enrollments, and courses across 3 tables.
Return \`student_name\`, \`course_code\`, \`course_title\`, and \`grade\` for all enrollments with a grade of 'A'. Sort by \`student_name\` ASC, then \`course_code\` ASC.`,
    init_sql: `CREATE TABLE learners (
  id INT PRIMARY KEY,
  student_name TEXT
);

CREATE TABLE subjects (
  code TEXT PRIMARY KEY,
  course_title TEXT
);

CREATE TABLE enrollments (
  id INT PRIMARY KEY,
  learner_id INT,
  subject_code TEXT,
  grade TEXT
);

INSERT INTO learners VALUES 
(1, 'Alice Young'), (2, 'Bob Lee'), (3, 'Chloe Patel');

INSERT INTO subjects VALUES 
('CS301', 'Database Architecture'),
('CS302', 'Operating Systems'),
('CS303', 'Computer Networks');

INSERT INTO enrollments VALUES 
(101, 1, 'CS301', 'A'),
(102, 1, 'CS302', 'B'),
(103, 2, 'CS301', 'A'),
(104, 2, 'CS303', 'A'),
(105, 3, 'CS302', 'A'),
(106, 3, 'CS303', 'C');`,
    solution_query: `SELECT l.student_name, s.code AS course_code, s.course_title, e.grade 
FROM enrollments e 
INNER JOIN learners l ON e.learner_id = l.id 
INNER JOIN subjects s ON e.subject_code = s.code 
WHERE e.grade = 'A' 
ORDER BY l.student_name ASC, course_code ASC;`,
  },
  {
    day_number: 14,
    title: 'Subquery Filtering: Above Average Earners',
    difficulty: 'Medium',
    points: 150,
    description: `Find all corporate employees whose individual salary is strictly greater than the company-wide average salary.
Return \`emp_id\`, \`name\`, \`salary\`, and department \`role\` ordered by \`salary\` DESC.`,
    init_sql: `CREATE TABLE workers (
  emp_id INT PRIMARY KEY,
  name TEXT,
  role TEXT,
  salary INT
);

INSERT INTO workers VALUES 
(1, 'Marcus Aurelius', 'Director', 145000),
(2, 'Seneca Younger', 'Engineer', 92000),
(3, 'Epictetus Stoic', 'Intern', 48000),
(4, 'Cleanthes Assos', 'Senior Dev', 112000),
(5, 'Zeno Citium', 'Architect', 135000),
(6, 'Chrysippus Soli', 'Analyst', 78000),
(7, 'Musonius Rufus', 'Engineer', 88000);`,
    solution_query: `SELECT emp_id, name, salary, role 
FROM workers 
WHERE salary > (SELECT AVG(salary) FROM workers) 
ORDER BY salary DESC;`,
  },
  {
    day_number: 15,
    title: 'Correlated Subquery with EXISTS',
    difficulty: 'Medium',
    points: 150,
    description: `Identify all projects that have at least one assigned engineer with a 'Lead' title.
Use the \`EXISTS\` clause. Return \`project_id\`, \`project_name\`, and \`budget\` ordered by \`budget\` DESC.`,
    init_sql: `CREATE TABLE projects (
  project_id INT PRIMARY KEY,
  project_name TEXT,
  budget INT
);

CREATE TABLE assignments (
  assignment_id INT PRIMARY KEY,
  project_id INT,
  member_name TEXT,
  title TEXT
);

INSERT INTO projects VALUES 
(1, 'Cloud Migration', 250000),
(2, 'Mobile Redesign', 90000),
(3, 'AI Recommendation Engine', 450000),
(4, 'Security Audit', 60000);

INSERT INTO assignments VALUES 
(101, 1, 'Sarah Chen', 'Lead Cloud Architect'),
(102, 1, 'Dave Miller', 'DevOps Engineer'),
(103, 2, 'Emily Rose', 'UI Designer'),
(104, 3, 'Alan Turing', 'Lead Research Scientist'),
(105, 3, 'Grace Hopper', 'Lead Systems Engineer'),
(106, 4, 'John McAfee', 'Security Analyst');`,
    solution_query: `SELECT p.project_id, p.project_name, p.budget 
FROM projects p 
WHERE EXISTS (
  SELECT 1 FROM assignments a 
  WHERE a.project_id = p.project_id 
    AND a.title LIKE '%Lead%'
) 
ORDER BY p.budget DESC;`,
  },

  // ==========================================
  // DAYS 16 - 21: ADVANCED (WINDOW FUNCTIONS, CTES, ANALYTICS)
  // ==========================================
  {
    day_number: 16,
    title: 'Latest Account Transaction (ROW_NUMBER)',
    difficulty: 'Hard',
    points: 200,
    description: `For each bank account, find the single most recent transaction record.
Use the \`ROW_NUMBER()\` window function partitioned by \`account_id\` and ordered by \`txn_date\` DESC.
Return \`account_id\`, \`txn_id\`, \`amount\`, and \`txn_date\` for only the latest transaction per account, sorted by \`account_id\` ASC.`,
    init_sql: `CREATE TABLE transactions (
  txn_id INT PRIMARY KEY,
  account_id INT,
  amount REAL,
  txn_date TEXT
);

INSERT INTO transactions VALUES 
(1, 101, 500.00, '2026-02-01'),
(2, 101, -120.50, '2026-02-05'),
(3, 101, 350.00, '2026-02-12'),
(4, 102, 1500.00, '2026-01-20'),
(5, 102, -400.00, '2026-02-10'),
(6, 103, 250.00, '2026-02-14'),
(7, 103, -50.00, '2026-02-15');`,
    solution_query: `WITH RankedTxns AS (
  SELECT txn_id, account_id, amount, txn_date,
         ROW_NUMBER() OVER(PARTITION BY account_id ORDER BY txn_date DESC) as rn
  FROM transactions
)
SELECT account_id, txn_id, amount, txn_date 
FROM RankedTxns 
WHERE rn = 1 
ORDER BY account_id ASC;`,
  },
  {
    day_number: 17,
    title: 'Chapter Competition Leaderboard (DENSE_RANK)',
    difficulty: 'Hard',
    points: 200,
    description: `Rank chapter participants based on total contest score using \`DENSE_RANK()\`.
Tied scores must receive identical rank numbers with no gaps in subsequent rankings.
Return \`rank\`, \`user_id\`, \`user_name\`, and \`score\` ordered by \`rank\` ASC, then \`user_name\` ASC.`,
    init_sql: `CREATE TABLE leaderboard_scores (
  user_id INT PRIMARY KEY,
  user_name TEXT,
  score INT
);

INSERT INTO leaderboard_scores VALUES 
(1, 'Elena Rostova', 950),
(2, 'David Chen', 950),
(3, 'Aisha Patel', 890),
(4, 'Marcus Vance', 820),
(5, 'Sarah Connor', 820),
(6, 'Leo Maxwell', 760),
(7, 'Fiona Gallagher', 990);`,
    solution_query: `SELECT 
  DENSE_RANK() OVER(ORDER BY score DESC) AS rank,
  user_id,
  user_name,
  score 
FROM leaderboard_scores 
ORDER BY rank ASC, user_name ASC;`,
  },
  {
    day_number: 18,
    title: 'Month-over-Month Growth (LAG Offset)',
    difficulty: 'Hard',
    points: 200,
    description: `Calculate month-over-month revenue differentials using the \`LAG()\` window function.
For each month, return \`month_num\`, \`revenue\`, the previous month's revenue as \`prev_month_revenue\` (fallback to 0 for month 1), and \`growth\` (\`revenue - prev_month_revenue\`). Sort by \`month_num\` ASC.`,
    init_sql: `CREATE TABLE monthly_financials (
  month_num INT PRIMARY KEY,
  revenue INT
);

INSERT INTO monthly_financials VALUES 
(1, 45000),
(2, 52000),
(3, 49000),
(4, 61000),
(5, 68000),
(6, 74000);`,
    solution_query: `SELECT 
  month_num,
  revenue,
  LAG(revenue, 1, 0) OVER(ORDER BY month_num ASC) AS prev_month_revenue,
  revenue - LAG(revenue, 1, 0) OVER(ORDER BY month_num ASC) AS growth 
FROM monthly_financials 
ORDER BY month_num ASC;`,
  },
  {
    day_number: 19,
    title: 'Cumulative Running Revenue Totals',
    difficulty: 'Hard',
    points: 200,
    description: `Compute a cumulative running total of store revenue day-by-day using an unbounded preceding window frame.
Return \`day_id\`, \`daily_amount\`, and the running total as \`running_total\` ordered by \`day_id\` ASC.`,
    init_sql: `CREATE TABLE daily_takings (
  day_id INT PRIMARY KEY,
  daily_amount INT
);

INSERT INTO daily_takings VALUES 
(1, 1200),
(2, 1850),
(3, 1400),
(4, 2100),
(5, 1950),
(6, 2600),
(7, 3100);`,
    solution_query: `SELECT 
  day_id,
  daily_amount,
  SUM(daily_amount) OVER(ORDER BY day_id ASC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_total 
FROM daily_takings 
ORDER BY day_id ASC;`,
  },
  {
    day_number: 20,
    title: 'Organizational Hierarchy (Recursive CTE)',
    difficulty: 'Hard',
    points: 200,
    description: `Traverse an organizational hierarchy tree using a recursive CTE.
Start at the CEO (\`manager_id IS NULL\` at \`level = 1\`) and recursively traverse to find each employee's depth \`level\`.
Return \`emp_id\`, \`emp_name\`, \`manager_id\`, and \`level\` ordered by \`level\` ASC, then \`emp_id\` ASC.`,
    init_sql: `CREATE TABLE org_structure (
  emp_id INT PRIMARY KEY,
  emp_name TEXT,
  manager_id INT
);

INSERT INTO org_structure VALUES 
(1, 'Satya (CEO)', NULL),
(2, 'Amy (CFO)', 1),
(3, 'Scott (CTO)', 1),
(4, 'Kevin (VP Eng)', 3),
(5, 'Julia (VP DevRel)', 3),
(6, 'Panos (VP Hardware)', 3),
(7, 'Mark (Principal Eng)', 4),
(8, 'Rachel (Senior Eng)', 7);`,
    solution_query: `WITH RECURSIVE OrgHierarchy AS (
  SELECT emp_id, emp_name, manager_id, 1 AS level
  FROM org_structure
  WHERE manager_id IS NULL
  
  UNION ALL
  
  SELECT o.emp_id, o.emp_name, o.manager_id, h.level + 1
  FROM org_structure o
  INNER JOIN OrgHierarchy h ON o.manager_id = h.emp_id
)
SELECT emp_id, emp_name, manager_id, level 
FROM OrgHierarchy 
ORDER BY level ASC, emp_id ASC;`,
  },
  {
    day_number: 21,
    title: 'Grand Finale: Customer Cohort Retention Engine',
    difficulty: 'Hard',
    points: 200,
    description: `Congratulations on reaching Day 21! 
Construct a multi-metric customer intelligence query using CTEs.
1. Calculate each customer's lifetime spend (\`lifetime_spend\`) and order count (\`total_orders\`).
2. Assign a customer tier: 'VIP' if lifetime_spend >= 1000, else 'Standard'.
3. Use \`DENSE_RANK()\` on \`lifetime_spend\` DESC to generate \`spend_rank\`.
Return \`customer_id\`, \`customer_name\`, \`total_orders\`, \`lifetime_spend\`, \`tier\`, and \`spend_rank\` ordered by \`spend_rank\` ASC, then \`customer_name\` ASC.`,
    init_sql: `CREATE TABLE shoppers (
  customer_id INT PRIMARY KEY,
  customer_name TEXT
);

CREATE TABLE shopper_orders (
  order_id INT PRIMARY KEY,
  customer_id INT,
  order_amount REAL
);

INSERT INTO shoppers VALUES 
(1, 'Ada Lovelace'),
(2, 'Alan Turing'),
(3, 'Grace Hopper'),
(4, 'Tim Berners-Lee'),
(5, 'Linus Torvalds');

INSERT INTO shopper_orders VALUES 
(101, 1, 600.00),
(102, 1, 550.00),
(103, 2, 300.00),
(104, 2, 450.00),
(105, 3, 1400.00),
(106, 4, 150.00),
(107, 5, 2200.00),
(108, 5, 350.00),
(109, 3, 200.00);`,
    solution_query: `WITH CustomerMetrics AS (
  SELECT 
    s.customer_id,
    s.customer_name,
    COUNT(o.order_id) AS total_orders,
    SUM(o.order_amount) AS lifetime_spend
  FROM shoppers s
  INNER JOIN shopper_orders o ON s.customer_id = o.customer_id
  GROUP BY s.customer_id, s.customer_name
)
SELECT 
  customer_id,
  customer_name,
  total_orders,
  lifetime_spend,
  CASE WHEN lifetime_spend >= 1000 THEN 'VIP' ELSE 'Standard' END AS tier,
  DENSE_RANK() OVER(ORDER BY lifetime_spend DESC) AS spend_rank
FROM CustomerMetrics
ORDER BY spend_rank ASC, customer_name ASC;`,
  },
];

/**
 * Main Seeding Runner
 */
async function seedContest() {
  console.log('🚀 Initializing 21-Day SQL Contest Database Seeding...');
  console.log(`📡 Connecting to Supabase at ${supabaseUrl}...`);
  console.log(`🔑 Client Mode: ${isUsingServiceRole ? 'Service Role (Admin Bypass)' : 'Anon Key (Subject to RLS)'}\n`);

  let successCount = 0;
  let failCount = 0;
  let rlsViolation = false;

  for (const challenge of challenges) {
    try {
      const { error } = await supabase
        .from('challenges')
        .upsert(challenge, { onConflict: 'day_number' });

      if (error) {
        console.error(`❌ Day ${challenge.day_number.toString().padStart(2, '0')} [${challenge.title}]: ${error.message}`);
        failCount++;
        if (error.message.includes('row-level security')) {
          rlsViolation = true;
        }
      } else {
        console.log(`✅ Day ${challenge.day_number.toString().padStart(2, '0')} [${challenge.title}] (${challenge.difficulty}, ${challenge.points} XP) seeded successfully.`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Day ${challenge.day_number} Exception:`, err.message);
      failCount++;
    }
  }

  console.log(`\n==========================================`);
  console.log(`🏁 Seeding Summary: ${successCount} Succeeded, ${failCount} Failed.`);
  console.log(`==========================================`);

  if (rlsViolation) {
    console.log(`\n💡 [RLS Notice]: Your 'challenges' table has Row-Level Security (RLS) enabled.`);
    console.log(`To permit direct script seeding:`);
    console.log(`1. Add SUPABASE_SERVICE_ROLE_KEY=your_service_role_key to your .env file, OR`);
    console.log(`2. In Supabase Dashboard -> SQL Editor, run:`);
    console.log(`   ALTER TABLE challenges DISABLE ROW LEVEL SECURITY;`);
    console.log(`   -- OR allow anon insert policy:`);
    console.log(`   CREATE POLICY "Allow anon insert" ON challenges FOR ALL USING (true) WITH CHECK (true);\n`);
  }
}

seedContest();
