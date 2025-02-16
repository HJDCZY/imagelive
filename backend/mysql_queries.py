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
        # 在提交之前先获取结果
        result = cursor.fetchall()
        connection.commit()
        return result
    except Error as e:
        print('在执行查询时发生错误：', e)
        return None
    finally:
        cursor.close()