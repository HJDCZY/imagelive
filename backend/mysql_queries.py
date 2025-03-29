import mysql.connector
from mysql.connector import Error
from config import config
from typing import Optional

# 将 connection 声明为 Optional 类型
connection: Optional[mysql.connector.MySQLConnection] = None

def is_connection_alive(conn: Optional[mysql.connector.MySQLConnection]) -> bool:
    try:
        if conn is None:
            return False
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        cursor.close()
        return True
    except Error:
        return False

def connect() -> Optional[mysql.connector.MySQLConnection]:
    global connection
    try:
        connection = mysql.connector.connect(
            host=config['database']['host'],
            port=config['database']['port'],
            user=config['database']['user'],
            password=config['database']['password'],
            database=config['database']['database'],
            pool_name='mypool',
            pool_size=5,
            autocommit=True,
            connection_timeout=28800,  # 修正：移除重复的 connection_timeout
            get_warnings=True,
            raise_on_warnings=True
        )
        print('数据库连接成功')
        return connection
    except Error as e:
        print('在连接数据库时发生错误：', e)
        return None

def query(conn: Optional[mysql.connector.MySQLConnection], query: str, params=None):
    global connection
    
    # 使用传入的连接对象，如果为 None 则使用全局连接
    active_connection = conn if conn is not None else connection
    
    # 检查连接状态
    if not is_connection_alive(active_connection):
        print('数据库连接已断开，尝试重新连接...')
        active_connection = connect()
        if active_connection is None:
            raise Exception("无法连接到数据库")
    
    cursor = active_connection.cursor()
    try:
        cursor.execute(query, params)
        
        if query.strip().upper().startswith('SELECT'):
            result = cursor.fetchall()
        else:
            result = cursor.rowcount > 0

        active_connection.commit()
        return result
    except Error as e:
        if not is_connection_alive(active_connection):
            print('执行过程中连接断开，尝试重新连接...')
            active_connection = connect()
            if active_connection is not None:
                return query(active_connection, query, params)
        
        error_info = {
            'error_code': e.errno,
            'error_msg': str(e),
            'sql_state': e.sqlstate if hasattr(e, 'sqlstate') else None
        }
        print('SQL错误详情:', error_info)
        raise Exception(f"SQL执行错误: {error_info['error_msg']}")
    finally:
        cursor.close()