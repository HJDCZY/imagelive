import React from 'react';
import config from '../config'

const LoadingScreen = () => (
    <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#f8f9fa',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9999
    }}>
        {/* 添加 Logo */}
        <img 
            src={config.logopath}
            alt="Logo"
            style={{
                width: '100px',
                height: '100px',
                objectFit: 'contain',
                marginBottom: '20px'
            }}
        />
        
        <div style={{
            width: '50px',
            height: '50px',
            border: '5px solid #f3f3f3',
            borderTop: '5px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '20px'
        }} />
        
        <h2 style={{
            color: '#333',
            marginBottom: '10px',
            fontWeight: 'normal',
            textAlign: 'center'
        }}>
            © 天津大学学生电视台 版权所有
        </h2>
        
        <div style={{
            color: '#666',
            fontSize: '14px',
            marginTop: '5px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px'
        }}>
            <span> 由HJDCZY在2024-2025寒假初次开发</span>
            <span>imagelive 项目采用 GPL-3.0 开源协议</span>
            <a 
                href="https://github.com/HJDCZY/imagelive" 
                target="_blank"
                rel="noopener noreferrer"
                style={{
                    color: '#3498db',
                    textDecoration: 'none'
                }}
            >
                在 GitHub 上查看源代码
            </a>
        </div>

        <style jsx>{`
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `}</style>
    </div>
);

export default LoadingScreen;