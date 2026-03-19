from django.urls import path

from .views import (
    AccountListCreateAPIView,
    AccountRetrieveAPIView,
    TransferCreateAPIView,
)

urlpatterns = [
    path("accounts/", AccountListCreateAPIView.as_view(), name="account-list-create"),
    path("accounts/<int:pk>/", AccountRetrieveAPIView.as_view(), name="account-detail"),
    path("transfers/", TransferCreateAPIView.as_view(), name="transfer-create"),
]
