import 'dotenv/config';
import pg from 'pg';
pg.types.setTypeParser(1700,parseFloat);
export const pool=new pg.Pool({connectionString:process.env.DATABASE_URL||'postgresql://postgres:postgres@127.0.0.1:5433/astrovital_db'});
export const q=(s,p)=>pool.query(s,p).then(r=>r.rows);
