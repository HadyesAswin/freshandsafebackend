"""merge team migrations

Revision ID: 09a4bea66101
Revises: 65a492e01472, 8f480258421b
Create Date: 2026-02-19 12:12:38.810644

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '09a4bea66101'
down_revision: Union[str, None] = ('65a492e01472', '8f480258421b')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
