import React from "react";

export default function PageContainer({
  children,
  title,
  subtitle,
  actions,
  breadcrumbs,
}) {
  return (
    <main className="page-container">
      <div className="page-inner">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="breadcrumbs">
            {breadcrumbs.map((item, index) => (
              <React.Fragment key={`${item}-${index}`}>
                <span
                  className={
                    index === breadcrumbs.length - 1
                      ? "breadcrumb-current"
                      : "breadcrumb-item"
                  }
                >
                  {item}
                </span>

                {index < breadcrumbs.length - 1 && (
                  <span className="breadcrumb-separator">/</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {(title || subtitle || actions) && (
          <div className="page-header">
            <div className="page-heading">
              {title && <h1>{title}</h1>}
              {subtitle && <p>{subtitle}</p>}
            </div>

            {actions && (
              <div className="page-actions">
                {actions}
              </div>
            )}
          </div>
        )}

        <div className="page-content">
          {children}
        </div>
      </div>

      <style>{`
        .page-container {
          min-height: calc(100vh - 72px);
          background: #f8fafc;
          margin-left: 260px;
          color: #111827;
        }

        .page-inner {
          width: 100%;
          max-width: 1480px;
          margin: 0 auto;
          padding: 28px 32px 50px;
          box-sizing: border-box;
        }

        .breadcrumbs {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 18px;
          color: #9ca3af;
          font-size: 11px;
          font-weight: 500;
        }

        .breadcrumb-current {
          color: #4b5563;
        }

        .breadcrumb-separator {
          color: #d1d5db;
        }

        .page-header {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 24px;
          margin-bottom: 28px;
        }

        .page-heading h1 {
          margin: 0;
          color: #111827;
          font-size: 26px;
          line-height: 1.2;
          font-weight: 750;
          letter-spacing: -0.035em;
        }

        .page-heading p {
          margin: 8px 0 0;
          color: #6b7280;
          font-size: 13px;
          line-height: 1.5;
        }

        .page-actions {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        .page-content {
          width: 100%;
        }

        @media (max-width: 1024px) {
          .page-container {
            margin-left: 260px;
          }

          .page-inner {
            padding: 24px;
          }
        }

        @media (max-width: 768px) {
          .page-container {
            margin-left: 0;
            min-height: calc(100vh - 72px);
          }

          .page-inner {
            padding: 20px 16px 40px;
          }

          .page-header {
            align-items: flex-start;
            flex-direction: column;
            margin-bottom: 22px;
          }

          .page-heading h1 {
            font-size: 23px;
          }

          .page-actions {
            width: 100%;
          }
        }
      `}</style>
    </main>
  );
}