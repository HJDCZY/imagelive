import mysql.connector
from mysql.connector import Error
from config import config

connection = None

def connect():
    global connection
    try:
        connection = mysql.connector.connect(
            host=config['database']['host'],
            port=config['database']['port'],
            user=config['database']['user'],
            password=config['database']['password'],
            database=config['database']['database']
        )
        print('连接成功')
        return connection
    except Error as e:
        print('在连接数据库时发生错误：', e)
        return None

def query(connection, query, params=None):
    if connection is None:
        connection = connect()
        if connection is None:
            raise Exception("无法连接到数据库")
    
    cursor = connection.cursor()
    try:
        cursor.execute(query, params)
        
        # 判断是否为 SELECT 查询
        if query.strip().upper().startswith('SELECT'):
            result = cursor.fetchall()
        else:
            # 对于 UPDATE、INSERT、DELETE 等操作，返回受影响的行数
            result = cursor.rowcount > 0

        connection.commit()
        return result
    except Error as e:
        error_info = {
            'error_code': e.errno,
            'error_msg': str(e),
            'sql_state': e.sqlstate if hasattr(e, 'sqlstate') else None
        }
        print('SQL错误详情:', error_info)
        raise Exception(f"SQL执行错误: {error_info['error_msg']}")
    finally:
        cursor.close()