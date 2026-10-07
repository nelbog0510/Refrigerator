# [공통] 메인 파일 (페이지 탭 및 라우팅)~~~₩

# import streamlit as st

# # 페이지 기본 설정
# st.set_page_config(page_title="게이미피케이션 스마트 냉장고", page_icon="🧊", layout="wide")

# st.title("🧊 게이미피케이션 스마트 냉장고")

# # A와 B가 만든 모듈을 탭으로 분리
# tab1, tab2, tab3 = st.tabs(["📋 재료 등록 & 관리 (A)", "🚨 신호등 냉장고 & AI 레시피 (B)", "⚙️ 설정 (A)"])

# with tab1:
#     # A개발자 파일 연결
#     try:
#         from modules import dev_a_inventory
#         dev_a_inventory.render()
#     except Exception as e:
#         st.info("A개발자의 dev_a_inventory.py 작성 대기 중...")

# with tab2:
#     # B개발자 파일 연결
#     try:
#         from modules import dev_b_dashboard
#         dev_b_dashboard.render()
#     except Exception as e:
#         st.info("B개발자의 dev_b_dashboard.py 작성 대기 중...")

# with tab3:
#     # A개발자 설정 파일 연결
#     try:
#         from modules import dev_a_settings
#         dev_a_settings.render()
#     except Exception as e:
#         st.info("A개발자의 dev_a_settings.py 작성 대기 중...")

        