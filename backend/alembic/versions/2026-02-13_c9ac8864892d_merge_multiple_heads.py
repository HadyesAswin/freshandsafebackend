"""merge multiple heads

Revision ID: c9ac8864892d
Revises: 9fb705cecf1e
Create Date: 2026-02-13 06:26:03.371199

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c9ac8864892d'
down_revision: Union[str, None] = '9fb705cecf1e'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
