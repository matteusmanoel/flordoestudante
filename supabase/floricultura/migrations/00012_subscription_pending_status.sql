-- Adiciona o valor 'pending_payment' ao enum subscription_status.
-- Necessário para representar assinaturas criadas antes do pagamento ser confirmado pelo Stripe.
-- O webhook de checkout.session.completed atualiza para 'active'.

ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'pending_payment' BEFORE 'active';
