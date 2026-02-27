"""merge multiple heads

Revision ID: edec93d76b8e
Revises: 09a4bea66101, fddd66a7f079
Create Date: 2026-02-24 11:29:37.600524

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'edec93d76b8e'
down_revision: Union[str, None] = ('09a4bea66101', 'fddd66a7f079')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
