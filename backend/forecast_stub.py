import pandas as pd
from models import Transaction
from app import create_app, db

app = create_app()
app.app_context().push()

def monthly_series(user_id):
    q = Transaction.query.filter(Transaction.user_id==user_id).all()
    if not q:
        return None
    df = pd.DataFrame([{"ds": t.date, "y": float(t.amount)} for t in q])
    df['ds'] = pd.to_datetime(df['ds'])
    df = df.groupby(pd.Grouper(key='ds', freq='M')).sum().reset_index()
    return df

if __name__ == "__main__":
    df = monthly_series(1)
    print(df.head())
    # integrate Prophet or other model here when ready
